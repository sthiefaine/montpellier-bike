"use client";

import { Suspense, useState } from "react";
import MapLibre from "./MapLibre";
import CounterDetails from "./CounterDetails";
import CounterDailyStats from "@/components/CounterDailyStats";
import CounterYearlyStats from "@/components/CounterYearlyStats";
import CounterHourlyStats from "@/components/CounterHourlyStats";
import CounterWeeklyStats from "@/components/CounterWeeklyStats";
import type { BikeCounter } from "@prisma/client";
import type { StyleSpecification } from "maplibre-gl";
import CounterDailyBarChart from "./CounterDailyBarChart";
import { PreloadedCounterData } from "../app/page";

interface CounterDetailsSectionProps {
  mapStyle: StyleSpecification;
  counters: (BikeCounter & { isActive: boolean })[];
  defaultSelectedCounter: BikeCounter | null;
  preloadedData: PreloadedCounterData[];
  currentYear: string;
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

  const selectedCounterData = selectedCounter
    ? preloadedData.find((data) => data.counterId === selectedCounter.id) ||
      null
    : null;

  return (
    <div className="flex flex-row flex-wrap justify-start gap-4 bg-gradient-to-b from-blue-50 to-white p-4">
      <div className="container-query grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
        <section className="bg-white rounded-xl shadow-lg p-4 @container col-span-1 sm:col-span-2">
          <div className="h-[calc(60vh-8rem)]">
            <MapLibre
              coordinates={{ lat: 43.610769, lng: 3.876716 }}
              mapStyle={mapStyle}
              counters={counters}
              onCounterSelect={setSelectedCounter}
              defaultSelectedCounter={defaultSelectedCounter}
            />
          </div>
        </section>
        <section className="bg-white rounded-xl shadow-lg p-4 @container col-span-1">
          <div className="h-[calc(60vh-8rem)]">
            <CounterDetails
              counter={selectedCounter}
              preloadedData={selectedCounterData}
            />
          </div>
        </section>
        <section className="bg-white rounded-xl shadow-lg p-4 @container col-span-1">
          <div className="h-[calc(60vh-8rem)]">
            <CounterDailyStats
              counter={selectedCounter}
              preloadedData={selectedCounterData}
            />
          </div>
        </section>
        <section className="bg-white rounded-xl shadow-lg p-4 @container col-span-1">
          <div className="h-[calc(60vh-8rem)]">
            <CounterYearlyStats
              counter={selectedCounter}
              preloadedData={selectedCounterData}
            />
          </div>
        </section>
        <section className="bg-white rounded-xl shadow-lg p-4 @container col-span-1 sm:col-span-2 lg:col-span-3">
          <div className="h-[calc(60vh-8rem)]">
            <Suspense fallback={<div>Loading...</div>}>
              <CounterDailyBarChart
                counter={selectedCounter}
                preloadedData={selectedCounterData}
                currentYear={currentYear}
              />
            </Suspense>
          </div>
        </section>
        <section className="bg-white rounded-xl shadow-lg p-4 @container col-span-1 sm:col-span-2">
          <div className="h-[calc(60vh-8rem)]">
            <CounterHourlyStats
              counter={selectedCounter}
              preloadedData={selectedCounterData}
            />
          </div>
        </section>
        <section className="bg-white rounded-xl shadow-lg p-4 @container col-span-1 sm:col-span-2">
          <div className="h-[calc(60vh-8rem)]">
            <CounterWeeklyStats
              counter={selectedCounter}
              preloadedData={selectedCounterData}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
