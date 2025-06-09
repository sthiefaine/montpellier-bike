"use client";

import { useEffect, useState } from "react";
import type { BikeCounter } from "@prisma/client";
import { HourlyStatsDetailsTypes } from "@/types/counters/details";
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

interface CounterDetailsHourlyStatsProps {
  counter: BikeCounter;
  hourlyStats: HourlyStatsDetailsTypes[] | null;
}

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

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
        <p className="text-sm font-medium text-gray-700">{label}h</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {WEEK_DAYS_CONFIG[entry.dataKey as keyof typeof WEEK_DAYS_CONFIG].name}: {entry.value !== null ? entry.value.toLocaleString() : "Aucune donnée"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CounterDetailsHourlyStats({
  counter,
  hourlyStats,
}: CounterDetailsHourlyStatsProps) {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const hourlyStatsForYear = hourlyStats?.filter((stats) => stats.year === selectedYear) || [];
  const maxWeek = hourlyStatsForYear.length > 0 ? hourlyStatsForYear[hourlyStatsForYear.length - 1].week.number : 1;
  const [selectedWeek, setSelectedWeek] = useState<number>(maxWeek);

  useEffect(() => {
    if (hourlyStats) {
      if (hourlyStatsForYear?.find((stats) => stats.week.number === selectedWeek)) {
        setSelectedWeek(selectedWeek);
      } else {
        setSelectedWeek(maxWeek);
      }
    }
  }, [selectedYear]);

  if (!hourlyStats || hourlyStats.length === 0) {
    return <CounterSkeleton />;
  }

  const currentStats = hourlyStats.find(
    (stats) => stats.year === selectedYear && stats.week.number === selectedWeek
  );

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("fr-FR").format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
    }).format(date);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const formatHour = (hour: number) => {
    return `${hour.toString().padStart(2, "0")}h`;
  };

  const chartData = hours.map((hour) => {
    const data: Record<string, number> = { hour };
    Object.entries(currentStats?.week.stats || {}).forEach(([day, stats]) => {
      const stat = stats.find((s) => s.hour === hour);
      data[day] = stat ? stat.value : 0;
    });
    return data;
  });

  const availableYears = hourlyStats.reduce(
    (acc, stats) => {
      if (stats.year < acc.start) acc.start = stats.year;
      if (stats.year > acc.end) acc.end = stats.year;
      return acc;
    },
    { start: Infinity, end: -Infinity }
  );

  const availableWeeks = hourlyStats
    .filter((stats) => stats.year === selectedYear)
    .map((stats) => stats.week.number)
    .sort((a, b) => a - b);

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Statistiques horaires par semaine
        </h3>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="flex flex-col gap-1">
            <label htmlFor="year-select" className="text-sm font-medium text-gray-700">
              Année
            </label>
            <select
              id="year-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 bg-white text-black"
            >
              {Array.from(
                { length: availableYears.end - availableYears.start + 1 },
                (_, i) => availableYears.start + i
              ).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="week-select" className="text-sm font-medium text-gray-700">
              Semaine
            </label>
            <select
              id="week-select"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(Number(e.target.value))}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm py-2 px-3 bg-white text-black"
            >
              {availableWeeks.map((week) => (
                <option key={week} value={week}>
                  Semaine {week}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        Semaine {currentStats?.week.number} (
        {formatDate(currentStats?.week.startDate || new Date())} -{" "}
        {formatDate(currentStats?.week.endDate || new Date())})
      </p>
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
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
                    {Object.values(WEEK_DAYS_CONFIG).map((day) => (
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
              {Object.values(WEEK_DAYS_CONFIG).map((day) => (
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
