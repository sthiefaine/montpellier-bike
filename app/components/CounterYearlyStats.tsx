"use client";

import { useEffect, useState } from "react";
import type { BikeCounter } from "@prisma/client";
import { getYearlyStats } from "@/app/actions/counters";
import CounterSkeleton from "./CounterSkeleton";

interface CounterYearlyStatsProps {
  counter: BikeCounter | null;
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
}: CounterYearlyStatsProps) {
  const [yearlyStats, setYearlyStats] = useState<
    { year: number; total: number }[]
  >([]);

  useEffect(() => {
    if (!counter) return;

    async function fetchYearlyStats() {
      if (!counter) return;
      const data = await getYearlyStats(counter.id);
      setYearlyStats(data);
    }

    fetchYearlyStats();
  }, [counter]);

  if (!counter || yearlyStats.length === 0) return <CounterSkeleton />;

  const maxTotal = Math.max(...yearlyStats.map((s) => s.total));

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
                {stat.total.toLocaleString("fr-FR")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
