"use client";

import type { BikeCounter } from "@prisma/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import CounterSkeleton from "@/components/Stats/Counters/CounterSkeleton";
import { PreloadedCounterData } from "@/types/counters/counters";

interface CounterHourlyStatsProps {
  counter: BikeCounter | null;
  preloadedData: PreloadedCounterData | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
        <p className="text-sm font-medium text-gray-700">{label}h</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value !== null ? entry.value : "Aucune donnée"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const dayFormatter = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });

const WEEK_DAYS_CONFIG = {
  monday: { key: "monday", name: dayFormatter.format(new Date(2024, 0, 1)), color: "#9333EA" },
  tuesday: { key: "tuesday", name: dayFormatter.format(new Date(2024, 0, 2)), color: "#2563eb" },
  wednesday: { key: "wednesday", name: dayFormatter.format(new Date(2024, 0, 3)), color: "#00FF00" },
  thursday: { key: "thursday", name: dayFormatter.format(new Date(2024, 0, 4)), color: "#FF0000" },
  friday: { key: "friday", name: dayFormatter.format(new Date(2024, 0, 5)), color: "#f59e0b" },
  saturday: { key: "saturday", name: dayFormatter.format(new Date(2024, 0, 6)), color: "#FFE000" },
  sunday: { key: "sunday", name: dayFormatter.format(new Date(2024, 0, 7)), color: "#14b8a6" },
} as const;

const DAY_ORDER = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const DAY_MAP = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
} as const;

export default function CounterHourlyStats({
  counter,
  preloadedData,
}: CounterHourlyStatsProps) {
  if (!counter || !preloadedData) return <CounterSkeleton />;

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("fr-FR").format(value);
  };

  const hours = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23,
  ];

  const hasData = (day: string) => {
    const dayData =
      preloadedData.hourlyStats[day as keyof typeof preloadedData.hourlyStats];
    return dayData && dayData.some((stat) => stat.value > 0);
  };

  const getVisibleDays = () => {
    const today = new Date().getDay();
    const todayKey = DAY_MAP[today as keyof typeof DAY_MAP];

    return Object.values(WEEK_DAYS_CONFIG)
      .filter((day) => hasData(day.key) && day.key !== todayKey)
      .sort((a, b) => DAY_ORDER.indexOf(a.key as typeof DAY_ORDER[number]) - DAY_ORDER.indexOf(b.key as typeof DAY_ORDER[number]));
  };

  const visibleDays = getVisibleDays();

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, "0")}h`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 pl-4">
        Statistiques horaires
      </h3>
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={hours.map((hour) => {
                return {
                  hour: hour,
                  ...Object.fromEntries(
                    visibleDays.map((day) => [
                      day.key,
                      preloadedData.hourlyStats[
                        day.key as keyof typeof preloadedData.hourlyStats
                      ][hour].value,
                    ])
                  ),
                };
              })}
              margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="hour"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 10 }}
                domain={[0, 23]}
                ticks={hours}
                tickFormatter={formatHour}
              />
              <YAxis
                tickFormatter={formatValue}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
                width={30}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                content={({ payload }) => (
                  <div className="flex flex-wrap justify-center gap-2 text-xs">
                    {visibleDays.map((day) => (
                      <div key={day.key} className="flex items-center gap-1">
                        <div
                          className="w-2 h-0.5"
                          style={{ backgroundColor: day.color }}
                        ></div>
                        <span style={{ color: day.color }}>
                          {day.name.slice(0, 3)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              />
              {visibleDays.map((day) => (
                <Line
                  key={day.key}
                  type="monotone"
                  dataKey={day.key}
                  name={day.name}
                  stroke={day.color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls={true}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
