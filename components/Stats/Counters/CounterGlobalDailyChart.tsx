"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { WEEK_DAYS_CONFIG } from "@/helpers";

interface CounterGlobalDailyStats {
  dailyTotals: { day: string; value: number; count: number }[];
  globalAverage: number;
}

interface CounterGlobalDailyChartProps {
  counterGlobalDailyStats: CounterGlobalDailyStats | null;
  currentYear: string;
}

export default function CounterGlobalDailyChart({
  counterGlobalDailyStats,
  currentYear,
}: CounterGlobalDailyChartProps) {
  if (!counterGlobalDailyStats?.dailyTotals?.length) {
    return null;
  }

  console.log("test counterGlobalDailyStats", counterGlobalDailyStats);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="text-sm font-medium text-gray-900">
            {label.charAt(0).toUpperCase() + label.slice(1)}
          </p>
          <p className="text-sm text-gray-600">
            {data.value.toLocaleString()} passages au total
          </p>
          <p className="text-xs text-gray-500">
            Sur {data.count} jours
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-2 h-full flex flex-col">
      <h4 className="text-sm font-semibold text-gray-900 pl-4 mb-2">
        Total des passages par jour ({currentYear})
      </h4>
      <div className="flex-1 bg-white p-2 rounded-lg shadow-sm">
        <div className="w-full h-[calc(100%-40px)]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={counterGlobalDailyStats.dailyTotals} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="day"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={counterGlobalDailyStats.globalAverage}
                stroke="#3b82f6"
                strokeWidth={2}
                label={{
                  value: `Moyenne: ${counterGlobalDailyStats.globalAverage.toLocaleString()}`,
                  position: "right",
                  fill: "#3b82f6",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
              >
                {counterGlobalDailyStats.dailyTotals.map((entry) => (
                  <Cell
                    key={entry.day}
                    fill={WEEK_DAYS_CONFIG[entry.day as keyof typeof WEEK_DAYS_CONFIG].color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
