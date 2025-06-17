"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface CounterGlobalDailyAverageStats {
  dailyAverages: { day: string; value: number; count: number }[];
}

interface CounterGlobalDailyAverageChartProps {
  counterGlobalDailyAverageStats: CounterGlobalDailyAverageStats | null;
}

export default function CounterGlobalDailyAverageChart({
  counterGlobalDailyAverageStats,
}: CounterGlobalDailyAverageChartProps) {
  if (!counterGlobalDailyAverageStats?.dailyAverages?.length) {
    return null;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="text-sm font-medium text-gray-900">
            {label.charAt(0).toUpperCase() + label.slice(1)}
          </p>
          <p className="text-sm text-gray-600">
            {data.value.toLocaleString()} passages en moyenne
          </p>
          <p className="text-xs text-gray-500">
            Calculé sur {data.count} jours (valeurs &gt; 5 passages)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-2 h-full flex flex-col">
      <h4 className="text-sm font-semibold text-gray-900 pl-4 mb-2">
        Moyenne des passages par jour
      </h4>
      <div className="flex-1 bg-white p-2 rounded-lg shadow-sm">
        <div className="w-full h-[calc(100%-40px)]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={counterGlobalDailyAverageStats.dailyAverages} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
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
              <Bar
                dataKey="value"
                fill="#a3e635"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 