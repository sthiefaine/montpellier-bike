"use client";

import { useEffect, useState } from "react";
import type { BikeCounter } from "@prisma/client";
import { getCounterStats } from "@/app/actions/counters";
import CounterSkeleton from "./CounterSkeleton";
import NumberFlow from "./NumberFlow";

interface CounterDailyStatsProps {
  counter: BikeCounter | null;
}

export default function CounterDailyStats({ counter }: CounterDailyStatsProps) {
  const [stats, setStats] = useState<{
    yesterday: number;
    today: number;
    firstPassageDate: Date | null;
    lastPassageDate: Date | null;
    lastPassageYesterday: Date | null;
    lastPassageToday: Date | null;
    totalPassages: number;
    maxDay: { date: Date; value: number } | null;
  } | null>(null);

  useEffect(() => {
    if (!counter) return;

    async function fetchStats() {
      if (!counter) return;
      const data = await getCounterStats(counter.id);
      setStats(data);
    }

    fetchStats();
  }, [counter]);

  if (!counter || !stats) return <CounterSkeleton />;

  const formatTime = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-gray-900">Statistiques</h3>

      <div className="bg-purple-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-purple-900 mb-1">Total des passages</p>
        <p className="text-lg font-semibold text-purple-700">
          <NumberFlow value={stats.totalPassages} />
        </p>
      </div>

      {stats.maxDay && (
        <div className="bg-red-50 p-1 rounded-lg h-[60px]">
          <p className="text-sm font-medium text-red-900 mb-1">Record de passages</p>
          <div className="flex items-baseline justify-between">
            <p className="text-base font-semibold text-red-700">
              <NumberFlow value={stats.maxDay.value} />
            </p>
            <p className="text-sm text-red-600">
              {formatDate(stats.maxDay.date)}
            </p>
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-blue-900 mb-1">Passages hier</p>
        <div className="flex items-baseline justify-between">
          <p className="text-base font-semibold text-blue-700">
            <NumberFlow value={stats.yesterday} />
          </p>
          {stats.lastPassageYesterday && (
            <p className="text-sm text-blue-600">
              Dernier passage : {formatTime(stats.lastPassageYesterday)}
            </p>
          )}
        </div>
      </div>

      <div className="bg-green-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-green-900 mb-1">Passages aujourd'hui</p>
        <div className="flex items-baseline justify-between">
          <p className="text-base font-semibold text-green-700">
            <NumberFlow value={stats.today} />
          </p>
          {stats.lastPassageToday && (
            <p className="text-sm text-green-600">
              Dernier passage : {formatTime(stats.lastPassageToday)}
            </p>
          )}
        </div>
      </div>


    </div>
  );
} 