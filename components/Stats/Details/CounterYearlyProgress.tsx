"use client";

import { BikeCounter } from "@prisma/client";
import { YearlyProgressStats } from "@/types/counters/counters";

interface CounterYearlyProgressProps {
  counter: BikeCounter;
  yearlyProgressStats: YearlyProgressStats[];
}

const COLORS: Record<string, string> = {
  "2019": "#8b5cf6",
  "2020": "#ec4899",
  "2021": "#14b8a6",
  "2022": "#3b82f6",
  "2023": "#22c55e",
  "2024": "#eab000",
  "2025": "#ef4444",
  "2026": "#f97316",
  "2027": "#ec4863",
};

export default function CounterYearlyProgress({
  yearlyProgressStats,
}: CounterYearlyProgressProps) {
  const stats = yearlyProgressStats || [];
  const sortedStats = [...stats].sort((a, b) => a.year - b.year);

  // Bissextile  ou non
  const isLeapYear = (year: number) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };

  const getDaysInYear = (year: number) => {
    return isLeapYear(year) ? 366 : 365;
  };

  const today = new Date();
  const currentDayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  const barWidths = sortedStats.map((stat) => {
    const daysInYear = getDaysInYear(stat.year);
    const progressionValeur = (stat.yearToDate / stat.total) * 100;
    const progressionCalendaire = (currentDayOfYear / daysInYear) * 100;
    return Math.min(progressionValeur, progressionCalendaire);
  });

  const maxBarWidth = Math.max(...barWidths);

  const barHeight = 56 * sortedStats.length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Statistiques annuelles
      </h2>
      <div className="space-y-6 relative h-[200px]">
        <div
          className="absolute top-[-10px] bottom-0 w-[1px] bg-gray-400 z-10"
          style={{
            height: `${barHeight}px`,
            left: `calc(${maxBarWidth}% + 1.5rem + 1px)`,
          }}
        />
        {sortedStats.map((stat, idx) => {
          const width = barWidths[idx];
          return (
            <div key={stat.year} className="flex items-center gap-2">
              <span className="w-10 text-xs text-gray-700 text-left">
                {stat.year}
              </span>
              <div className="relative flex-1 flex items-center h-8 bg-gray-200 rounded">
                <div
                  className="absolute left-0 top-0 h-8 rounded transition-all duration-500"
                  style={{
                    width: `${width}%`,
                    background: COLORS[stat.year.toString()] || "#888",
                  }}
                />
                <span
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black text-xs px-2 py-0.5 rounded shadow"
                  style={{ pointerEvents: "none" }}
                >
                  {new Intl.NumberFormat("fr-FR").format(stat.yearToDate)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
