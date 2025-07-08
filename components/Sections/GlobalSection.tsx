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
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl shadow-lg p-6 flex flex-col items-center transform hover:scale-105 transition-all duration-300 hover:shadow-xl">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-3 shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Statistiques Avancées</h3>
                <p className="text-sm text-gray-600 text-center mb-4 max-w-xs">
                  Explorez des analyses détaillées avec filtres et comparaisons
                </p>
                <Link
                  href="/general"
                  className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-1 transition-all duration-200"
                >
                  <span>Explorer</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
