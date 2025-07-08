"use server";

import { prisma } from "@/lib/prisma";
import { getMapStyle } from "@/actions/map";
import CountersListPageClient from "@/app/counters/CountersListPageClient";
import { BikeCounter } from "@prisma/client";

interface CountersListPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    view?: string;
  }>;
}

const getCounters = async () => {
  const counters = await prisma.bikeCounter.findMany({
    orderBy: {
      name: "asc",
    },
  });
  return counters;
};

const getCountersWithStatus = async (counters: BikeCounter[]) => {
  const countersWithStatus = await Promise.all(
    counters.map(async (counter) => {
      const isActive = await prisma.counterTimeseries.findFirst({
        where: {
          counterId: counter.id,
          date: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 derniers jours
          },
        },
      });

      return {
        ...counter,
        isActive: !!isActive,
      };
    })
  );
  return countersWithStatus;
};

export default async function CountersListPage({
  searchParams,
}: CountersListPageProps) {
  const { search, status, view } = await searchParams;

  const counters = await getCounters();

  const [mapStyle, countersWithStatus] = await Promise.all([
    getMapStyle(),
    getCountersWithStatus(counters),
  ]);

  const formatCounterName = (name: string | null) => {
    if (!name) return "";
    return name.replace(/^Compteur Vélo\s*/i, "").trim();
  };

  let filteredCounters = countersWithStatus;

  if (search) {
    const searchLower = search.toLowerCase();
    filteredCounters = filteredCounters.filter((counter) => {
      const name = formatCounterName(counter.name).toLowerCase();
      const serialNumber = counter.serialNumber.toLowerCase();
      return name.includes(searchLower) || serialNumber.includes(searchLower);
    });
  }

  if (status && status !== "all") {
    if (status === "active") {
      filteredCounters = filteredCounters.filter((c) => c.isActive);
    } else if (status === "inactive") {
      filteredCounters = filteredCounters.filter((c) => !c.isActive);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Liste des compteurs
              </h1>
              <p className="text-gray-600">
                {filteredCounters.length} compteurs trouvés sur{" "}
                {countersWithStatus.length} au total
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {countersWithStatus.filter((c) => c.isActive).length} actifs
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {countersWithStatus.filter((c) => !c.isActive).length}{" "}
                  inactifs
                </span>
              </div>
            </div>
          </div>
        </div>

        <CountersListPageClient
          counters={filteredCounters}
          allCounters={countersWithStatus}
          mapStyle={mapStyle}
          searchParams={{ search, status, view }}
        />
      </div>
    </div>
  );
}
