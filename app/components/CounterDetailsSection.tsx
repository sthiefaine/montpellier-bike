"use client";

import { useState } from "react";
import MapLibre from "./MapLibre";
import CounterDetails from "./CounterDetails";
import CounterDailyStats from "@/app/components/CounterDailyStats";
import CounterYearlyStats from "@/app/components/CounterYearlyStats";
import CounterHourlyStats from "@/app/components/CounterHourlyStats";
import CounterWeeklyStats from "@/app/components/CounterWeeklyStats";
import type { BikeCounter } from "@prisma/client";
import type { StyleSpecification } from "maplibre-gl";
import CounterDailyBarChart from "./CounterDailyBarChart";
import { PreloadedCounterData } from "../page";

interface CounterDetailsSectionProps {
  mapStyle: StyleSpecification;
  counters: BikeCounter[];
  defaultSelectedCounter: BikeCounter | null;
  preloadedData: PreloadedCounterData[];
}

export default function CounterDetailsSection({
  mapStyle,
  counters,
  defaultSelectedCounter,
  preloadedData,
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
      <section className="w-[300px] h-[calc(60vh-8rem)] bg-white rounded-xl shadow-lg p-4">
        <MapLibre
          coordinates={{ lat: 43.610769, lng: 3.876716 }}
          mapStyle={mapStyle}
          counters={counters}
          onCounterSelect={setSelectedCounter}
          defaultSelectedCounter={defaultSelectedCounter}
          preloadedData={selectedCounterData?.countersStatus}
        />
      </section>
      <section className="w-[300px] h-[calc(60vh-8rem)] bg-white rounded-xl shadow-lg p-4">
        <CounterDetails
          counter={selectedCounter}
          preloadedData={selectedCounterData}
        />
      </section>
      <section className="w-[300px] h-[calc(60vh-8rem)] bg-white rounded-xl shadow-lg p-4">
        <CounterDailyStats
          counter={selectedCounter}
          preloadedData={selectedCounterData}
        />
      </section>
      <section className="w-[300px] h-[calc(60vh-8rem)] bg-white rounded-xl shadow-lg p-4">
        <CounterYearlyStats
          counter={selectedCounter}
          preloadedData={selectedCounterData}
        />
      </section>
      <section className="w-[300px] h-[calc(60vh-8rem)] bg-white rounded-xl shadow-lg p-4">
        <CounterHourlyStats
          counter={selectedCounter}
          preloadedData={selectedCounterData}
        />
      </section>
      <section className="w-[300px] h-[calc(60vh-8rem)] bg-white rounded-xl shadow-lg p-4">
        <CounterWeeklyStats
          counter={selectedCounter}
          preloadedData={selectedCounterData}
        />
      </section>
      <section className="w-[600px] h-[calc(60vh-8rem)] bg-white rounded-xl shadow-lg p-4">
        <CounterDailyBarChart
          counter={selectedCounter}
          preloadedData={selectedCounterData}
        />
      </section>
    </div>
  );
}
