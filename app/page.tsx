"use server";

import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
import maplibregl from "maplibre-gl";

import CounterDetailsSection from "@/app/components/CounterDetailsSection";
import HeroSection from "@/app/components/HeroSection";

import { BikeCounter } from "@prisma/client";

import { getCounters, getCounterIsActive } from "@/app/actions/counters/base";
import { getCounterStats } from "@/app/actions/counters/stats";
import { getHourlyStats } from "@/app/actions/counters/hourly";
import { getWeeklyStats } from "@/app/actions/counters/weekly";
import { getYearlyStats } from "@/app/actions/counters/yearly";
import { getDailyStatsForYear } from "@/app/actions/counters/daily";

export interface PreloadedCounterData {
  counterId: string;
  counterStats: {
    maxDay: { date: Date; value: number } | null;
    beforeYesterday: number;
    yesterday: number;
    totalPassages: number;
    firstPassageDate: Date | null;
    lastPassageDate: Date | null;
    lastPassageBeforeYesterday: Date | null;
    lastPassageYesterday: Date | null;
  };
  hourlyStats: {
    monday: { hour: number; value: number }[];
    tuesday: { hour: number; value: number }[];
    wednesday: { hour: number; value: number }[];
    thursday: { hour: number; value: number }[];
    friday: { hour: number; value: number }[];
    saturday: { hour: number; value: number }[];
    sunday: { hour: number; value: number }[];
  };
  weeklyStats: {
    currentWeek: { day: string; value: number | null }[];
    lastWeek: { day: string; value: number | null }[];
    currentWeekAverage: number;
    lastWeekAverage: number;
    globalAverage: number;
  };
  yearlyStats: { year: number; total: number }[];
  dailyBarStats: {
    year: { day: string; value: number }[];
    globalAverage: number;
    activeDaysAverage: number;
  };
  counterIsActive: boolean;
}

const getMapStyle = cache(async () => {
  const data = await fs.readFile(
    path.join(process.cwd(), "data/map/style.json"),
    "utf8"
  );
  return JSON.parse(data) as maplibregl.StyleSpecification;
});

const getDefaultSelectedCounter = cache(async () => {
  const counters = (await getCounters()) as BikeCounter[];
  return (
    counters.find(
      (counter) =>
        counter.serialNumber === "X2H21070351" ||
        counter.serialNumber1 === "X2H21070352"
    ) || null
  );
});

const preloadAllCounterData = cache(
  async (counters: any[]): Promise<PreloadedCounterData[]> => {
    const preloadedData: PreloadedCounterData[] = [];

    for (const counter of counters) {
      try {
        const [
          counterStats,
          hourlyStats,
          weeklyStats,
          yearlyStats,
          dailyBarStats,
          counterIsActive,
        ] = await Promise.all([
          getCounterStats(counter.id),
          getHourlyStats(counter.id),
          getWeeklyStats(counter.id),
          getYearlyStats(counter.id),
          getDailyStatsForYear(counter.id),
          getCounterIsActive(counter.id),
        ]);

        preloadedData.push({
          counterId: counter.id,
          counterStats,
          hourlyStats,
          weeklyStats,
          yearlyStats,
          dailyBarStats,
          counterIsActive,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `Erreur lors du chargement des données pour le compteur ${counter.id}:`,
          error
        );
        continue;
      }
    }

    return preloadedData;
  }
);

export default async function Home() {
  const [counters, mapStyle] = await Promise.all([
    getCounters(),
    getMapStyle(),
  ]);

  const defaultSelectedCounter = await getDefaultSelectedCounter();
  const preloadedData = await preloadAllCounterData(counters);
  const currentYear = new Date().getFullYear().toString();

  const countersWithIsActive = counters.map((counter: BikeCounter) => ({
    ...counter,
    isActive:
      preloadedData.find((data) => data.counterId === counter.id)
        ?.counterIsActive || false,
  }));

  return (
    <main className="flex flex-col">
      <HeroSection />
      <div className="bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="max-w-[98%] mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
                Explorez les compteurs de mobilité douce
              </h2>
              <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-2">
                Découvrez les statistiques détaillées de chaque compteur à
                Montpellier. Sélectionnez un compteur sur la carte pour voir son
                historique et ses tendances.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
              <div className="lg:col-span-10 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[500px] md:min-h-[600px]">
                <CounterDetailsSection
                  mapStyle={mapStyle}
                  counters={countersWithIsActive}
                  defaultSelectedCounter={defaultSelectedCounter}
                  preloadedData={preloadedData}
                  currentYear={currentYear}
                />
              </div>
              <div className="lg:col-span-2 space-y-3 md:space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3">
                    Comment ça marche ?
                  </h3>
                  <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">1.</span>
                      Sélectionnez un compteur sur la carte
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">2.</span>
                      Consultez les statistiques en temps réel
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500">3.</span>
                      Explorez l'historique des passages
                    </li>
                  </ul>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
                  <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3">
                    À propos des compteurs
                  </h3>
                  <div className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-600">
                    <p>
                      Les compteurs installés à Montpellier permettent de
                      mesurer le trafic cycliste et piéton. Les données sont
                      mises à jour quotidiennement (J+1 7h du matin) pour suivre
                      l'évolution de la mobilité douce.
                    </p>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-2 md:p-3">
                      <h4 className="font-medium text-red-800 mb-1.5 flex items-center gap-2 text-xs md:text-sm">
                        <span className="w-2 h-2 md:w-2.5 md:h-2.5 bg-red-500 rounded-full"></span>
                        Compteurs inactifs
                      </h4>
                      <p className="text-red-700 text-xs">
                        Les compteurs marqués en rouge sont considérés comme
                        inactifs car ils n'ont pas transmis de données depuis
                        plus de deux semaines. Ils peuvent être en maintenance
                        ou temporairement hors service.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
