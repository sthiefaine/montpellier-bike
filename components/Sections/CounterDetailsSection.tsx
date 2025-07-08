"use client";

import { useState } from "react";
import MapLibre from "@/components/Maps/MapLibre";
import CounterDetails from "@/components/Stats/Counters/CounterDetails";
import CounterDailyStats from "@/components/Stats/Counters/CounterDailyStats";
import CounterYearlyStats from "@/components/Stats/Counters/CounterYearlyStats";
import CounterHourlyStats from "@/components/Stats/Counters/CounterHourlyStats";
import CounterWeeklyStats from "@/components/Stats/Counters/CounterWeeklyStats";
import type { BikeCounter } from "@prisma/client";
import type { StyleSpecification } from "maplibre-gl";
import CounterDailyBarChart from "@/components/Stats/Counters/CounterDailyBarChart";
import { PreloadedCounterData } from "@/types/counters/counters";

interface CounterDetailsSectionProps {
  mapStyle: StyleSpecification;
  counters: (BikeCounter & { isActive: boolean })[];
  defaultSelectedCounter: BikeCounter | null;
  preloadedData: PreloadedCounterData;
  currentYear: string;
}

function CountersList({
  counters,
  selectedCounter,
  onCounterSelect,
}: {
  counters: (BikeCounter & { isActive: boolean })[];
  selectedCounter: BikeCounter | null;
  onCounterSelect: (counter: BikeCounter | null) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  
  const formatCounterName = (name: string | null) => {
    if (!name) return "";
    return name.replace(/^Compteur Vélo\s*/i, "").trim();
  };

  const filteredCounters = counters.filter((counter) => {
    const searchLower = searchTerm.toLowerCase();
    const name = formatCounterName(counter.name).toLowerCase();
    const serialNumber = counter.serialNumber.toLowerCase();
    
    return name.includes(searchLower) || serialNumber.includes(searchLower);
  });

  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un compteur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1">
          {filteredCounters.map((counter) => (
            <div
              key={counter.id}
              className={`p-2 rounded-md border cursor-pointer transition-all duration-200 ${
                selectedCounter?.id === counter.id
                  ? "bg-blue-50 border-blue-300 shadow-sm"
                  : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              } ${!counter.isActive ? "opacity-60" : ""}`}
              onClick={() => onCounterSelect(counter)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-medium text-gray-900 text-xs truncate">
                      {formatCounterName(counter.name) || counter.serialNumber}
                    </h3>
                    <div
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        counter.isActive ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {counter.serialNumber}
                  </p>
                </div>
                <div className="text-right ml-2">
                  <div className="text-xs text-gray-500">
                    {counter.isActive ? "Actif" : "Inactif"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CounterDetailsSection({
  mapStyle,
  counters,
  defaultSelectedCounter,
  preloadedData,
  currentYear,
}: CounterDetailsSectionProps) {
  const [selectedCounter, setSelectedCounter] = useState<BikeCounter | null>(
    defaultSelectedCounter || null
  );
  const [showMap, setShowMap] = useState(true);

  const selectedCounterData = selectedCounter
    ? preloadedData.counters.find((data) => data.counterId === selectedCounter.id) ||
      null
    : null;

  return (
    <div className="flex flex-row flex-wrap justify-start gap-4 bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="container-query grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
        <section className="bg-white rounded-xl shadow-lg p-4 @container col-span-1 sm:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {showMap ? "Carte des compteurs" : "Liste des compteurs"}
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowMap(true)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  showMap
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Carte
              </button>
              <button
                onClick={() => setShowMap(false)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  !showMap
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Liste
              </button>
            </div>
          </div>
          <div className="h-[calc(60vh-8rem)]">
            {showMap ? (
              <MapLibre
                coordinates={{ lat: 43.610769, lng: 3.876716 }}
                mapStyle={mapStyle}
                counters={counters}
                defaultZoom={10}
                onCounterSelect={setSelectedCounter}
                defaultSelectedCounter={defaultSelectedCounter}
              />
            ) : (
              <CountersList
                counters={counters}
                selectedCounter={selectedCounter}
                onCounterSelect={setSelectedCounter}
              />
            )}
          </div>
        </section>
        <section className="bg-white rounded-xl shadow-lg p-4 @container col-span-1">
          <div className="h-[calc(60vh-8rem)]">
            <CounterDetails
              counter={selectedCounter}
              counterStats={selectedCounterData?.counterStats || null}
            />
          </div>
        </section>
        <section className="bg-white rounded-xl shadow-lg p-4 @container col-span-1">
          <div className="h-[calc(60vh-8rem)]">
            <CounterDailyStats
              counter={selectedCounter}
              counterStats={selectedCounterData?.counterStats || null}
            />
          </div>
        </section>
        <section className="bg-white rounded-xl shadow-lg p-4 @container col-span-1">
          <div className="h-[calc(60vh-8rem)]">
            <CounterYearlyStats
              counter={selectedCounter}
              yearlyStats={selectedCounterData?.yearlyStats || []}
            />
          </div>
        </section>
        <section className="bg-white rounded-xl shadow-lg p-4 @container col-span-1 sm:col-span-2 lg:col-span-3">
          <div className="h-[calc(60vh-8rem)]">
              <CounterDailyBarChart
                counter={selectedCounter}
                dailyBarStats={selectedCounterData?.dailyBarStats || null}
                currentYear={currentYear}
              />
          </div>
        </section>
        <section className="bg-white rounded-xl shadow-lg p-4 @container col-span-1 sm:col-span-2">
          <div className="h-[calc(60vh-8rem)]">
            <CounterHourlyStats
              counter={selectedCounter}
              hourlyStats={selectedCounterData?.hourlyStats || null}
            />
          </div>
        </section>
        <section className="bg-white rounded-xl shadow-lg p-4 @container col-span-1 sm:col-span-2">
          <div className="h-[calc(60vh-8rem)]">
            <CounterWeeklyStats
              counter={selectedCounter}
              weeklyStats={selectedCounterData?.weeklyStats || null}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
