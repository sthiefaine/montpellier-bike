"use client";

import { BikeCounter } from "@prisma/client";
import {
  CounterValue,
  getValuesForYear,
  calculateStats,
} from "@/actions/counters/allData";
import {
  getStartOfYearParis,
} from "@/actions/counters/dateHelpers";

interface CounterYearlyProgressProps {
  counter: BikeCounter;
  allValues: CounterValue[];
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

interface YearlyStat {
  year: number;
  total: number;
  yearToDate: number;
}

export default function CounterYearlyProgress({
  allValues,
}: CounterYearlyProgressProps) {
  const calculateYearlyStats = (): YearlyStat[] => {
    const years = new Set<number>();

    allValues.forEach((value) => {
      years.add(value.date.getFullYear());
    });

    const yearlyStats: YearlyStat[] = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();

    years.forEach((year) => {
      const yearValues = getValuesForYear(allValues, year);
      const yearStats = calculateStats(yearValues);

      // Calculer yearToDate (données jusqu'au même jour de l'année)
      const sameDayInYear = new Date(year, currentMonth, currentDay);
      const yearStart = getStartOfYearParis(new Date(year, 6, 1));
      
      // Calculer les données jusqu'au même jour de l'année
      const yearToDateValues = allValues.filter(
        (value) => value.date >= yearStart && value.date <= sameDayInYear
      );
      const yearToDate = calculateStats(yearToDateValues).total;

      console.log(`Année ${year}:`, {
        total: yearStats.total,
        yearToDate,
        sameDayInYear: sameDayInYear.toISOString(),
        yearStart: yearStart.toISOString(),
        filteredCount: yearToDateValues.length,
      });

      yearlyStats.push({
        year,
        total: yearStats.total,
        yearToDate,
      });
    });

    return yearlyStats.sort((a, b) => a.year - b.year);
  };

  const stats = calculateYearlyStats();

  // Bissextile ou non
  const isLeapYear = (year: number) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };

  const getDaysInYear = (year: number) => {
    return isLeapYear(year) ? 366 : 365;
  };

  // Calculer le jour de l'année pour une date donnée
  const getDayOfYear = (date: Date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const barWidths = stats.map((stat) => {
    const daysInYear = getDaysInYear(stat.year);
    
    // Calculer la progression basée sur le même jour de l'année
    const sameDayInYear = new Date(stat.year, currentMonth, currentDay);
    const currentDayOfYear = getDayOfYear(sameDayInYear);
    const progressionCalendaire = (currentDayOfYear / daysInYear) * 100;
    const progressionValeur = (stat.yearToDate / stat.total) * 100;
    
    const width = Math.min(progressionValeur, progressionCalendaire);
    
    console.log(`Barre ${stat.year}:`, {
      yearToDate: stat.yearToDate,
      total: stat.total,
      progressionValeur,
      progressionCalendaire,
      width,
      sameDayInYear: sameDayInYear.toISOString(),
      currentDayOfYear,
    });

    return width;
  });

  const maxBarWidth = barWidths.length > 0 ? Math.max(...barWidths) : 0;

  const barHeight = 56 * stats.length;

  // Formater la date actuelle pour l'affichage
  const formatCurrentDate = () => {
    return today.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col gap-2 mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Statistiques annuelles
        </h2>
        <p className="text-sm text-gray-600">
          Chaque année affiche les données jusqu'au {formatCurrentDate()}
        </p>
      </div>
      <div className="space-y-6 relative h-[200px]">
        <div
          className="absolute top-[-10px] bottom-0 w-[1px] bg-gray-400 z-10"
          style={{
            height: `${barHeight}px`,
            left: `calc(${maxBarWidth}% + 1.5rem + 3px)`,
          }}
        />
        {stats.map((stat, idx) => {
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
                  className="absolute z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black text-xs px-2 py-0.5 rounded shadow"
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
