"use server";

import { getGlobalStats } from "@/actions/counters/stats";
import { getDailyStats } from "@/actions/dailyStats";
import { getTodayWeather } from "@/actions/weather";
import NumberFlow from "@/components/NumberFlow";
import StatsBar from "@/components/Stats/Counters/StatsBar";
import WeatherMessage from "@/components/Weathers/WeatherMessage";
import Image from "next/image";

const getDailyStatsData = async () => {
  const data = await getDailyStats();
  return data;
};

const getGlobalStatsData = async () => {
  const data = await getGlobalStats();
  return data;
};

export default async function HeroSection() {
  const [stats, dailyStats, todayWeather] = await Promise.all([
    getGlobalStatsData(),
    getDailyStatsData(),
    getTodayWeather(),
  ]);

  const maxPassages = Math.max(
    dailyStats.passages.yesterday,
    dailyStats.passages.dayBeforeYesterday
  );
  const yesterdayPercentage =
    (dailyStats.passages.yesterday / maxPassages) * 100;
  const dayBeforeYesterdayPercentage =
    (dailyStats.passages.dayBeforeYesterday / maxPassages) * 100;

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-6 mb-4">
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                <NumberFlow value={stats.totalCounters} /> Eco-Compteurs à
                Montpellier
              </h1>
              <p className="text-lg text-gray-600 mb-3">
                Suivez la mobilité douce dans les rues de Montpellier et les
                alentours, déjà <NumberFlow value={stats.totalPassages} />{" "}
                passages depuis le{" "}
                {stats.firstPassageDate
                  ? new Date(stats.firstPassageDate).toLocaleDateString("fr-FR")
                  : "début des mesures"}
              </p>
              <WeatherMessage
                temperature={todayWeather?.temperature ?? null}
                isRaining={todayWeather?.isRaining ?? false}
                isCloudy={todayWeather?.isCloudy ?? false}
              />
            </div>
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 transform transition-transform duration-200 z-10">
                <Image
                  src="/images/velo_f.png"
                  alt="Illustration d'un cycliste"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="w-20 h-20 absolute inset-0 transform transition-transform duration-200 -translate-x-[-60px] translate-y-2 z-0">
                <Image
                  src="/images/trotinette_h.png"
                  alt="Illustration d'un utilisateur de trottinette"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
          <div className="max-w-md mx-auto md:mx-0">
            <span className="text-sm font-medium text-gray-700">Passages</span>
            <div className="grid grid-cols-2 gap-3">
              <StatsBar
                label="Avant-hier"
                value={dailyStats.passages.dayBeforeYesterday}
                percentage={dayBeforeYesterdayPercentage}
                temperature={dailyStats.weather.dayBeforeYesterday.temperature}
                color="blue"
                isRaining={false}
                isCloudy={false}
              />
              <StatsBar
                label="Hier"
                value={dailyStats.passages.yesterday}
                percentage={yesterdayPercentage}
                temperature={dailyStats.weather.yesterday.temperature}
                color="green"
                isRaining={dailyStats.weather.yesterday.isRaining}
                isCloudy={dailyStats.weather.yesterday.isCloudy}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
