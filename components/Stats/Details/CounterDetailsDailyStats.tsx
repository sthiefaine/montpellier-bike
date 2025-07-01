"use client";

import NumberFlow from "@/components/NumberFlow";
import {
  CounterValue,
  calculateStats,
  calculateDailyStats,
} from "@/actions/counters/allData";

interface CounterDetailsDailyStatsProps {
  allValues: CounterValue[];
}

export default function CounterDetailsDailyStats({
  allValues,
}: CounterDetailsDailyStatsProps) {
  const stats = calculateStats(allValues);
  const dailyStats = calculateDailyStats(allValues);

  const maxDay =
    dailyStats.length > 0
      ? dailyStats.reduce((max, day) => (day.value > max.value ? day : max))
      : null;

  const firstPassageDate = allValues.length > 0 ? allValues[0].date : null;
  const lastPassageDate =
    allValues.length > 0 ? allValues[allValues.length - 1].date : null;

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
          {firstPassageDate
            ? formatDate(firstPassageDate) + " " + formatTime(firstPassageDate)
            : "N/A"}
        </p>
      </div>
      <div className="bg-green-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-green-900 mb-1">
          Dernier passage
        </p>
        <p className="text-base font-semibold text-green-700">
          {lastPassageDate
            ? formatDate(lastPassageDate) + " " + formatTime(lastPassageDate)
            : "N/A"}
        </p>
      </div>
      <div className="bg-purple-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-purple-900 mb-1">
          Total des passages
        </p>
        <p className="text-base font-semibold text-purple-700">
          <NumberFlow value={stats.total} /> passages
        </p>
      </div>
      {maxDay && (
        <div className="bg-orange-50 p-1 rounded-lg h-[60px]">
          <p className="text-sm font-medium text-orange-900 mb-1">
            Jour le plus fréquenté
          </p>
          <div className="flex flex-row items-center gap-2">
            <p className="text-base font-semibold text-orange-700">
              {<NumberFlow value={maxDay.value} />}
            </p>
            <span className="text-xs text-orange-500 first-letter:uppercase">
              {formatDate(maxDay.date)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
