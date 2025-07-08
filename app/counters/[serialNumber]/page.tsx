"use server";
import { notFound } from "next/navigation";
import CounterYearlyProgress from "@/components/Stats/Details/CounterYearlyProgress";
import CounterDetailsMap from "@/components/Stats/Details/CounterDetailsMap";
import CounterDetailsDailyStats from "@/components/Stats/Details/CounterDetailsDailyStats";
import CounterWeeklyStats from "@/components/Stats/Counters/CounterWeeklyStats";
import CounterDailyBarChart from "@/components/Stats/Counters/CounterDailyBarChart";
import { getCounterStats } from "@/actions/counters/stats";
import { getHourlyDetailsStats } from "@/actions/counters/hourly";
import { getWeeklyStats } from "@/actions/counters/weekly";
import { getYearlyProgressStats } from "@/actions/counters/yearly";
import { getDailyStatsForYear } from "@/actions/counters/daily";
import { getCounterData, getCounterIsActive } from "@/actions/counters/base";
import Link from "next/link";
import { PreloadedCounterDetailsData } from "@/types/counters/details";
import CounterDetailsHourlyStats from "@/components/Stats/Details/CounterDetailsHourlyStats";
import { prisma } from "@/lib/prisma";
import { getMapStyle } from "@/actions/map";
import { getCurrentSerialNumber } from "@/helpers";

export async function generateStaticParams() {
  const counters = await prisma.bikeCounter.findMany({
    select: {
      serialNumber: true,
      serialNumber1: true,
    },
  });

  return counters.flatMap((counter) => {
    const params = [{ serialNumber: counter.serialNumber }];
    if (counter.serialNumber1 && /^[a-zA-Z]/.test(counter.serialNumber1)) {
      params.push({ serialNumber: counter.serialNumber1 });
    }
    return params;
  });
}

interface CounterDetailsPageProps {
  params: Promise<{
    serialNumber: string;
  }>;
}

export default async function CounterDetailsPage({
  params,
}: CounterDetailsPageProps) {
  const { serialNumber } = await params;
  const counter = await getCounterData(serialNumber);

  if (!counter) {
    notFound();
  }

  const [
    mapStyle,
    counterStats,
    hourlyStats,
    weeklyStats,
    yearlyProgressStats,
    dailyBarStats,
    counterIsActive,
  ] = await Promise.all([
    getMapStyle(),
    getCounterStats(counter.id),
    getHourlyDetailsStats(counter.id),
    getWeeklyStats(counter.id),
    getYearlyProgressStats(counter.id),
    getDailyStatsForYear(counter.id),
    getCounterIsActive(counter.id),
  ]);

  const preloadedData: PreloadedCounterDetailsData = {
    counterId: counter.id,
    counterStats,
    hourlyStats,
    weeklyStats,
    yearlyProgressStats,
    dailyBarStats,
    counterIsActive,
  };

  const currentYear = new Date().getFullYear().toString();

  const fixedSerialNumber = getCurrentSerialNumber(
    counter.serialNumber,
    counter.serialNumber1
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête avec informations principales */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {counter.name}
              </h1>
              <p className="text-sm text-gray-600">
                Numéro de série : {fixedSerialNumber}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  counterIsActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {counterIsActive ? "Actif" : "Inactif"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-6">
          <div className="col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-3 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Localisation
            </h2>
            <div className="h-[200px] rounded-lg overflow-hidden">
              <CounterDetailsMap
                counter={counter}
                mapStyle={mapStyle}
                isActive={counterIsActive}
              />
            </div>
          </div>

          <div className="col-span-12 md:col-span-6 lg:col-span-6 xl:col-span-4 bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Statistiques générales
            </h2>
            <CounterDetailsDailyStats
              counterStats={preloadedData.counterStats}
            />
          </div>

          <div className="col-span-12 md:col-span-12 lg:col-span-12 xl:col-span-5">
            <CounterYearlyProgress
              counter={counter}
              yearlyProgressStats={preloadedData.yearlyProgressStats || []}
            />
          </div>

          <div className="col-span-12">
            <CounterDetailsHourlyStats
              counter={counter}
              hourlyStats={preloadedData.hourlyStats}
            />
          </div>

          <div className="col-span-12">
            <CounterWeeklyStats
              counter={counter}
              weeklyStats={preloadedData.weeklyStats}
            />
          </div>

          <div className="col-span-12">
            <section className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Statistiques journalières
              </h2>
              <div className="h-[calc(60vh-8rem)]">
                  <CounterDailyBarChart
                    counter={counter}
                    dailyBarStats={preloadedData.dailyBarStats || []}
                    currentYear={currentYear}
                  />
              </div>
            </section>
          </div>

          <div className="col-span-12">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 md:p-4">
              <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3">
                À propos du compteur
              </h3>
              <div className="space-y-2 md:space-y-3 text-xs md:text-sm text-gray-600">
                <p>
                  Ce compteur mesure le trafic cycliste et piéton à cet
                  emplacement. Les données sont mises à jour quotidiennement
                  (J+1 7h du matin).
                </p>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 md:p-3">
                  <h4 className="font-medium text-blue-800 mb-1.5 flex items-center gap-2 text-xs md:text-sm">
                    <span className="w-2 h-2 md:w-2.5 md:h-2.5 bg-blue-500 rounded-full"></span>
                    État du compteur
                  </h4>
                  <p className="text-blue-700 text-xs">
                    {counterIsActive
                      ? "Le compteur est actif et transmet des données régulièrement."
                      : "Le compteur est inactif et n'a pas transmis de données depuis plus de deux semaines."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
