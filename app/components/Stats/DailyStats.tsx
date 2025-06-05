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

export type DailyStatsProps = {
  passages: {
    yesterday: number;
    today: number;
  };
};

export default function DailyStats({ passages }: DailyStatsProps) {
  if (!passages) {
    return <div>Erreur lors du chargement des statistiques</div>;
  }

  const chartData = [
    {
      name: "Hier",
      passages: passages.yesterday,
    },
    {
      name: "Aujourd'hui",
      passages: passages.today,
    },
  ];

  const formatValue = (value: number) => {
    return value.toLocaleString("fr-FR");
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded-lg shadow-lg border border-gray-100 absolute -translate-x-1/2">
          <p className="text-gray-700 font-medium">{label}</p>
          <p className="text-orange-500 font-semibold">
            {formatValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-medium text-gray-700 mb-4">Passages</h3>
      <div className="h-[180px]">
        <ResponsiveContainer width={250} height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
            barGap={0}
            barSize={50}
          >
            <defs>
              <linearGradient id="colorPassages" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
              padding={{ left: 0, right: 0 }}
            />
            <YAxis
              tickFormatter={formatValue}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="passages"
              name="Passages"
              fill="url(#colorPassages)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
