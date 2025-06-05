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
} from "recharts";
import { getHourlyStats } from "@/app/actions/counters";
import CounterSkeleton from "./CounterSkeleton";
import { PreloadedCounterData } from "../page";

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

export default function CounterHourlyStats({ counter, preloadedData }: CounterHourlyStatsProps) {
  if (!counter || !preloadedData) return <CounterSkeleton />;

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("fr-FR").format(value);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const hasData = (day: string) => {
    const dayData = preloadedData.hourlyStats[day as keyof typeof preloadedData.hourlyStats];
    return dayData && dayData.some((stat) => stat.value > 0);
  };

  const getVisibleDays = () => {
    const days = [
      { key: "monday", name: "Lundi", color: "#3b82f6" },
      { key: "tuesday", name: "Mardi", color: "#22c55e" },
      { key: "wednesday", name: "Mercredi", color: "#eab308" },
      { key: "thursday", name: "Jeudi", color: "#ef4444" },
      { key: "friday", name: "Vendredi", color: "#8b5cf6" },
      { key: "saturday", name: "Samedi", color: "#ec4899" },
      { key: "sunday", name: "Dimanche", color: "#14b8a6" },
    ];

    return days.filter((day) => hasData(day.key));
  };

  const visibleDays = getVisibleDays();

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-900 pl-4">
        Statistiques horaires
      </h3>
      <div className="bg-white p-2 rounded-lg shadow-sm">
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={hours.map((hour) => ({
                hour,
                ...Object.fromEntries(
                  visibleDays.map((day) => [
                    day.key,
                    preloadedData.hourlyStats[day.key as keyof typeof preloadedData.hourlyStats][hour]
                      .value,
                  ])
                ),
              }))}
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
                        <span style={{ color: day.color }}>{day.name.slice(0, 3)}</span>
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
