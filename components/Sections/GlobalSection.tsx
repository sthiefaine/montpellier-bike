"use server";

import { getGlobalDailyStatsForYear } from "@/actions/counters/daily";
import { getGlobalYearlyStats } from "@/actions/counters/yearly";
import { getGlobalWeeklyComparisonStats } from "@/actions/counters/weekly";
import CounterGlobalDailyChart from "@/components/Stats/Counters/CounterGlobalDailyChart";
import CounterGlobalWeeklyLineChart from "@/components/Stats/Counters/CounterGlobalWeeklyLineChart";
import CounterYearlyStats from "@/components/Stats/Counters/CounterYearlyStats";
import Link from "next/link";

const getGlobalDailyStatsData = async () => {
  const data = await getGlobalDailyStatsForYear();
  return data;
};

export default async function GlobalSection() {
  const globalDailyStats = await getGlobalDailyStatsData();
  const yearlyStats = await getGlobalYearlyStats();
  const weeklyComparisonStats = await getGlobalWeeklyComparisonStats();
  const currentYear = new Date().getFullYear().toString();

  return (
    <section className="bg-gradient-to-b from-white to-blue-50">
      <div className="container mx-auto px-4 py-4 md:py-6">
        <div className="max-w-[98%] mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">
                Statistiques Globales
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                Découvrez les statistiques globales de tous les compteurs de Montpellier. Visualisez le total des passages par jour de la semaine.
              </p>
            </div>
            <div className="mt-4 md:mt-0 md:ml-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 flex flex-col items-center">
                <span className="text-sm text-gray-700 mb-2">Voir la page générale</span>
                <Link
                  href="/general"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-lg shadow hover:from-blue-600 hover:to-blue-800 transition-all duration-200"
                >
                  Accéder
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <CounterYearlyStats
                yearlyStats={yearlyStats}
              />
            </div>
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <CounterGlobalDailyChart
                counterGlobalDailyStats={globalDailyStats}
                currentYear={currentYear}
              />
            </div>
          </div>
          <div className="w-full">
            <CounterGlobalWeeklyLineChart
              weeklyComparisonStats={weeklyComparisonStats}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
