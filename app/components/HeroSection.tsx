"use server";

import { getDailyStats, getGlobalStats } from "@/app/actions/counters";
import NumberFlow from "@/app/components/NumberFlow";
import DailyStats from "@/app/components/Stats/DailyStats";
import WeatherStats from "@/app/components/Stats/WeatherStats";
import { Suspense } from "react";
import DailyStatsSkeleton from "@/app/components/Stats/DailyStatsSkeleton";
import WeatherStatsSkeleton from "@/app/components/Stats/WeatherStatsSkeleton";

const getDailyStatsData = async () => {
  const data = await getDailyStats();
  return data;
};

const getGlobalStatsData = async () => {
  const data = await getGlobalStats();
  return data;
};

export default async function HeroSection() {
  const stats = await getGlobalStatsData();
  const dailyStats = await getDailyStatsData();

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              <NumberFlow value={stats.totalCounters} /> Eco-Compteurs à
              Montpellier
            </h1>
            <p className="text-xl text-gray-600">
              Suivez la mobilité douce dans les rues de Montpellier et les
              alentours, déjà <NumberFlow value={stats.totalPassages} />{" "}
              passages depuis le{" "}
              {stats.firstPassageDate
                ? new Date(stats.firstPassageDate).toLocaleDateString("fr-FR")
                : "début des mesures"}
            </p>
          </div>
          <div className="flex gap-4">
            <Suspense fallback={<DailyStatsSkeleton />}>
              <DailyStats passages={dailyStats.passages} />
            </Suspense>
            <Suspense fallback={<WeatherStatsSkeleton />}>
              <WeatherStats weather={dailyStats.weather} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
