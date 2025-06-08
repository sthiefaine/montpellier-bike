"use client";

import type { BikeCounter } from "@prisma/client";
import CounterSkeleton from "./CounterSkeleton";
import NumberFlow from "./NumberFlow";
import { PreloadedCounterData } from "../page";

interface CounterDailyStatsProps {
  counter: BikeCounter | null;
  preloadedData: PreloadedCounterData | null;
}

export default function CounterDailyStats({
  counter,
  preloadedData,
}: CounterDailyStatsProps) {
  const stats = preloadedData?.counterStats;

  if (!counter || !stats) return <CounterSkeleton />;

  const formatTime = (date: Date | null) => {
    if (!date) return null;

    const newDate = new Date(date);
    const time = newDate.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Paris",
    });

    if (time === "23:00") {
      return "23:59";
    }
    return time;
  };

  const formatDate = (date: Date) => {
    const newDate = new Date(date);
    return newDate.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Paris",
    });
  };

  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-gray-900">Statistiques</h3>
      <div className="bg-green-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-green-900 mb-1">Avant-hier</p>
        <div className="flex flex-row items-center gap-2 justify-between">
          <p className="text-base font-semibold text-green-700">
            {<NumberFlow value={stats.beforeYesterday} />} passages
          </p>
          <span className="text-base text-right text-green-500 first-letter:uppercase">
            {formatTime(stats.lastPassageBeforeYesterday)}
          </span>
        </div>
      </div>
      <div className="bg-blue-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-blue-900 mb-1">Hier</p>
        <div className="flex flex-row items-center gap-2 justify-between">
          <p className="text-base font-semibold text-blue-700">
            {<NumberFlow value={stats.yesterday} />} passages
          </p>
          <span className="text-base text-right text-blue-500 first-letter:uppercase">
            {formatTime(stats.lastPassageYesterday)}
          </span>
        </div>
      </div>
      <div className="bg-purple-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-purple-900 mb-1">
          Total des passages
        </p>
        <p className="text-base font-semibold text-purple-700">
          {<NumberFlow value={stats.totalPassages} />} passages
        </p>
      </div>
      {stats.maxDay && (
        <div className="bg-orange-50 p-1 rounded-lg h-[60px]">
          <p className="text-sm font-medium text-orange-900 mb-1">
            Jour le plus fréquenté
          </p>
          <div className="flex flex-row items-center gap-2">
            <p className="text-base font-semibold text-orange-700">
              {<NumberFlow value={stats.maxDay.value} />}
            </p>
            <span className="text-xs text-orange-500 first-letter:uppercase">
              {formatDate(stats.maxDay.date)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
