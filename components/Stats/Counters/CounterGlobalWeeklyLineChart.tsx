"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import CounterSkeleton from "@/components/Stats/Counters/CounterSkeleton";
import { getGlobalWeeklyStatsForYear } from "@/actions/counters/weekly";

interface CounterGlobalWeeklyLineStats {
  year: { week: string; value: number }[];
}

interface CounterGlobalWeeklyLineChartProps {
  counterGlobalWeeklyLineStats: CounterGlobalWeeklyLineStats | null;
  currentYear: string;
}

export default function CounterGlobalWeeklyLineChart({
  counterGlobalWeeklyLineStats: initialStats,
  currentYear,
}: CounterGlobalWeeklyLineChartProps) {
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [stats, setStats] = useState<CounterGlobalWeeklyLineStats | null>(initialStats);
  const [isLoading, setIsLoading] = useState(false);
  const years = Array.from(
    { length: new Date().getFullYear() - 2020 + 1 },
    (_, i) => (2020 + i).toString()
  );

  useEffect(() => {
    const loadData = async () => {
      if (selectedYear === currentYear) {
        setStats(initialStats);
        return;
      }
      
      setIsLoading(true);
      try {
        const newStats = await getGlobalWeeklyStatsForYear(selectedYear);
        setStats(newStats);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedYear, currentYear, initialStats]);

  if (!stats || isLoading) return <CounterSkeleton />;

  const formatDate = (date: string) => {
    const utcDate = new Date(date);
    const weekNumber = getWeekNumber(utcDate);
    return `S${weekNumber}`;
  };

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  if (!stats?.year?.length) {
    return <CounterSkeleton />;
  }

  const chartData = stats.year.map((d) => ({
    week: formatDate(d.week),
    value: d.value,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow-sm">
          <p className="text-sm font-medium text-gray-900">{label}</p>
          <p className="text-sm text-gray-600">
            {payload[0].value.toLocaleString()} passages
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="mb-2 h-full flex flex-col">
      <div className="flex justify-between items-center px-4 mb-2">
        <h4 className="text-sm font-semibold text-gray-900">
          Passages hebdomadaires globaux
        </h4>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="text-sm border border-gray-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 bg-white p-2 rounded-lg shadow-sm">
        <div className="w-full h-[calc(100%-40px)]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="week"
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#a3e635"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#a3e635" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
} 