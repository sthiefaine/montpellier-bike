"use client";

import { useEffect, useState } from "react";
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
import { getWeeklyStats } from "@/app/actions/counters";
import CounterSkeleton from "./CounterSkeleton";

interface CounterWeeklyStatsProps {
  counter: BikeCounter | null;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const currentWeekData = payload.find(
      (p: any) => p.name === "Cette semaine"
    );
    const lastWeekData = payload.find(
      (p: any) => p.name === "Semaine dernière"
    );

    return (
      <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-sm text-blue-600">
          Cette semaine:{" "}
          {currentWeekData?.value !== null
            ? currentWeekData?.value
            : "Aucune donnée"}
        </p>
        <p className="text-sm text-green-600">
          Semaine dernière:{" "}
          {lastWeekData?.value !== null ? lastWeekData?.value : "Aucune donnée"}
        </p>
      </div>
    );
  }
  return null;
};

export default function CounterWeeklyStats({
  counter,
}: CounterWeeklyStatsProps) {
  const [weeklyStats, setWeeklyStats] = useState<{
    currentWeek: { day: string; value: number | null }[];
    lastWeek: { day: string; value: number | null }[];
    currentWeekAverage: number;
    lastWeekAverage: number;
  } | null>(null);

  useEffect(() => {
    if (!counter) return;

    async function fetchWeeklyStats() {
      if (!counter) return;
      const data = await getWeeklyStats(counter.id);
      setWeeklyStats(data);
    }

    fetchWeeklyStats();
  }, [counter]);

  if (!counter || !weeklyStats) return <CounterSkeleton />;

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("fr-FR").format(value);
  };

  const globalAverage = Math.round(
    (weeklyStats.currentWeekAverage + weeklyStats.lastWeekAverage) / 2
  );

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-900 pl-4">
        Statistiques hebdomadaires
      </h3>
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={weeklyStats.currentWeek}
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
                data={weeklyStats.lastWeek}
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
