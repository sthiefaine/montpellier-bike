"use server";

import { getGlobalStats } from "@/app/actions/counters";
import { getDailyStats } from "@/app/actions/dailyStats";
import NumberFlow from "@/app/components/NumberFlow";

const getDailyStatsData = async () => {
  const data = await getDailyStats();
  return data;
};

const getGlobalStatsData = async () => {
  const data = await getGlobalStats();
  return data;
};

export default async function HeroSection() {
  const [stats, dailyStats] = await Promise.all([
    getGlobalStatsData(),
    getDailyStatsData(),
  ]);

  const maxPassages = Math.max(dailyStats.passages.yesterday, dailyStats.passages.dayBeforeYesterday);
  const yesterdayPercentage = (dailyStats.passages.yesterday / maxPassages) * 100;
  const dayBeforeYesterdayPercentage = (dailyStats.passages.dayBeforeYesterday / maxPassages) * 100;

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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-24 text-sm text-gray-700 text-left">
                Avant-hier
              </span>
              <div className="relative flex-1 flex items-center h-8 bg-gray-200 rounded">
                <div
                  className="absolute left-0 top-0 h-8 rounded bg-blue-500 transition-all duration-500"
                  style={{ width: `${dayBeforeYesterdayPercentage}%` }}
                ></div>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black text-sm px-2 py-0.5 rounded shadow">
                  <NumberFlow value={dailyStats.passages.dayBeforeYesterday} />
                </span>
              </div>
              {dailyStats.weather.yesterday !== null && (
                <span className="text-sm text-gray-600 w-16">
                  {dailyStats.weather.yesterday}°C
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-24 text-sm text-gray-700 text-left">
                Hier
              </span>
              <div className="relative flex-1 flex items-center h-8 bg-gray-200 rounded">
                <div
                  className="absolute left-0 top-0 h-8 rounded bg-green-500 transition-all duration-500"
                  style={{ width: `${yesterdayPercentage}%` }}
                ></div>
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black text-sm px-2 py-0.5 rounded shadow">
                  <NumberFlow value={dailyStats.passages.yesterday} />
                </span>
              </div>
              {dailyStats.weather.today !== null && (
                <span className="text-sm text-gray-600 w-16">
                  {dailyStats.weather.today}°C
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
