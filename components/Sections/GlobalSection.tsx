"use server";

import { getGlobalDailyStatsForYear } from "@/actions/counters/daily";
import { getGlobalYearlyStats } from "@/actions/counters/yearly";
import CounterGlobalDailyChart from "@/components/Stats/Counters/CounterGlobalDailyChart";
import CounterYearlyStats from "@/components/Stats/Counters/CounterYearlyStats";

const getGlobalDailyStatsData = async () => {
  const data = await getGlobalDailyStatsForYear();
  return data;
};

export default async function GlobalSection() {
  const globalDailyStats = await getGlobalDailyStatsData();
  const yearlyStats = await getGlobalYearlyStats();
  const currentYear = new Date().getFullYear().toString();

  return (
    <section className="bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="max-w-[98%] mx-auto">
          <div className="text-center mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">
              Statistiques Globales
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Découvrez les statistiques globales de tous les compteurs de
              Montpellier. Visualisez le total des passages par jour de la semaine.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <CounterYearlyStats
                yearlyStats={yearlyStats}
              />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-[calc(40vh)]">
              <CounterGlobalDailyChart
                counterGlobalDailyStats={globalDailyStats}
                currentYear={currentYear}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
