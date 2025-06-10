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
  ReferenceLine,
} from "recharts";
import CounterSkeleton from "@/components/Stats/Counters/CounterSkeleton";
import { WeeklyStats } from "@/types/counters/counters";

interface CounterWeeklyStatsProps {
  counter: BikeCounter | null;
  weeklyStats: WeeklyStats | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {payload.map((entry: any) => (
          <p
            key={entry.name}
            className="text-sm"
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value !== null ? entry.value : "Aucune donnée"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CounterWeeklyStats({
  counter,
  weeklyStats,
}: CounterWeeklyStatsProps) {
  if (!counter || !weeklyStats) return <CounterSkeleton />;

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("fr-FR").format(value);
  };

  const formatDay = (day: string) => {
    return day;
  };

  const globalAverage = Math.round(
    (weeklyStats.currentWeekAverage + weeklyStats.lastWeekAverage) /
      2
  );

  const ensureAllDays = (data: { day: string; value: number | null }[]) => {
    const allDays = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
    return allDays.map((day) => {
      const existingDay = data.find((d) => d.day === day);
      return existingDay || { day, value: null };
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 pl-4">
        Statistiques hebdomadaires
      </h3>
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={ensureAllDays(weeklyStats.currentWeek).map(
                (day) => ({
                  ...day,
                  day: formatDay(day.day),
                })
              )}
              margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 12 }}
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
                  <div className="flex justify-center gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-0.5 bg-[#3b82f6]"></div>
                      <span className="text-[#3b82f6]">Cette sem</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-0.5 bg-[#22c55e]"></div>
                      <span className="text-[#22c55e]">Sem dernière</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-0.5 border-t border-dashed border-[#94a3b8]"></div>
                      <span className="text-[#94a3b8]">Moyenne</span>
                    </div>
                  </div>
                )}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Cette semaine"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                connectNulls={true}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Semaine dernière"
                data={ensureAllDays(weeklyStats.lastWeek).map(
                  (day) => ({
                    ...day,
                    day: formatDay(day.day),
                  })
                )}
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                connectNulls={true}
              />
              <ReferenceLine
                y={globalAverage}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{
                  value: `Moyenne: ${formatValue(globalAverage)}`,
                  position: "right",
                  fill: "#94a3b8",
                  fontSize: 12,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
