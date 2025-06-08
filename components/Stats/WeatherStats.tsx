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


export type WeatherStatsProps = {
  weather: {
    yesterday: number | null;
    today: number | null;
  };
};

export default function WeatherStats({ weather }: WeatherStatsProps) {

  if (!weather) {
    return <div>Erreur lors du chargement des statistiques</div>;
  }

  const chartData = [
    {
      name: "Hier",
      temperature: weather.yesterday ?? 0,
    },
    {
      name: "Aujourd'hui",
      temperature: weather.today ?? 0,
    },
  ];

  const formatValue = (value: number) => {
    return `${value.toFixed(1)}°C`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
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
      <h3 className="text-lg font-medium text-gray-700 mb-4">Températures</h3>
      <div className="h-[180px]">
        <ResponsiveContainer width={250} height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorTemperature" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={formatValue}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="temperature"
              name="Température"
              fill="url(#colorTemperature)"
              radius={[4, 4, 0, 0]}
              barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
