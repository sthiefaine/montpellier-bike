"use client";

import { BikeCounter } from "@prisma/client";
import NumberFlow from "@/components/NumberFlow";

interface CounterDetailsDailyStatsProps {
  counterStats: {
    firstPassageDate: Date | null;
    lastPassageDate: Date | null;
    totalPassages: number;
    maxDay: {
      date: Date;
      value: number;
    } | null;
  };
}

export default function CounterDetailsDailyStats({
  counterStats,
}: CounterDetailsDailyStatsProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[200px]">
      <div className="bg-blue-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-blue-900 mb-1">
          Premier passage
        </p>
        <p className="text-base font-semibold text-blue-700">
          {counterStats.firstPassageDate
            ? formatDate(counterStats.firstPassageDate) +
              " " +
              formatTime(counterStats.firstPassageDate)
            : "N/A"}
        </p>
      </div>
      <div className="bg-green-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-green-900 mb-1">
          Dernier passage
        </p>
        <p className="text-base font-semibold text-green-700">
          {counterStats.lastPassageDate
            ? formatDate(counterStats.lastPassageDate) +
              " " +
              formatTime(counterStats.lastPassageDate)
            : "N/A"}
        </p>
      </div>
      <div className="bg-purple-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-purple-900 mb-1">
          Total des passages
        </p>
        <p className="text-base font-semibold text-purple-700">
          <NumberFlow value={counterStats.totalPassages} /> passages
        </p>
      </div>
      {counterStats.maxDay && (
        <div className="bg-orange-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-orange-900 mb-1">
          Jour le plus fréquenté
        </p>
        <div className="flex flex-row items-center gap-2">
          <p className="text-base font-semibold text-orange-700">
            {<NumberFlow value={counterStats.maxDay.value} />}
          </p>
          <span className="text-xs text-orange-500 first-letter:uppercase">
            {formatDate(counterStats.maxDay.date)}
          </span>
        </div>
      </div>
      )}
    </div>
  );
}
