"use client";

import { useEffect, useState } from "react";
import type { BikeCounter } from "@prisma/client";
import { getYearlyStats } from "@/app/actions/counters";
import CounterSkeleton from "./CounterSkeleton";
import { PreloadedCounterData } from "../page";

interface CounterYearlyStatsProps {
  counter: BikeCounter | null;
  preloadedData: PreloadedCounterData | null;
}

const COLORS = [
  "#3b82f6", // bleu
  "#22c55e", // vert
  "#eab308", // jaune
  "#ef4444", // rouge
  "#8b5cf6", // violet
  "#ec4899", // rose
  "#14b8a6", // turquoise
  "#f97316", // orange
];

export default function CounterYearlyStats({
  counter,
  preloadedData,
}: CounterYearlyStatsProps) {
  const yearlyStats = preloadedData?.yearlyStats;


  if (!counter || !yearlyStats) return <CounterSkeleton />;

  const maxTotal = Math.max(...yearlyStats.map((s) => s.total));

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("fr-FR").format(value);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-gray-900">
        Total passages par année
      </h3>
      <div className="space-y-2">
        {yearlyStats.map((stat, idx) => (
          <div key={stat.year} className="flex items-center gap-2">
            <span className="w-6 text-xs text-gray-700 text-left">
              {stat.year}
            </span>
            <div className="relative flex-1 flex items-center h-8 bg-gray-200 rounded">
              <div
                className="absolute left-0 top-0 h-8 rounded"
                style={{
                  width: `${(stat.total / maxTotal) * 100}%`,
                  background: COLORS[idx % COLORS.length],
                  transition: "width 0.5s",
                }}
              ></div>
              <span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black text-xs px-2 py-0.5 rounded shadow"
                style={{ pointerEvents: "none" }}
              >
                {formatValue(stat.total)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
