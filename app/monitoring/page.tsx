"use server";
import { cache } from "react";
import { BikeCounter } from "@prisma/client";
import {
  getCounters,
  getCounterIsActiveSinceDays,
} from "@/actions/counters/base";
import { getMapStyle } from "@/actions/map";
import { getGlobalDailyStatsForYear } from "@/actions/counters/daily";
import MonitoringPageClient from "@/app/monitoring/MonitoringPageClient";

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

export default async function MonitoringPage() {
  const [counters, mapStyle, globalDailyStats] = await Promise.all([
    getCounters(),
    getMapStyle(),
    getGlobalDailyStatsForYear(),
  ]);

  const defaultSelectedCounter = await getDefaultSelectedCounter();

  const countersWithAllStates = await Promise.all(
    counters.map(async (counter: BikeCounter) => {
      const [isActive1Day, isActive2Days, isActive7Days, isActive14Days, isActive30Days] = await Promise.all([
        getCounterIsActiveSinceDays(counter.id, 1),
        getCounterIsActiveSinceDays(counter.id, 2),
        getCounterIsActiveSinceDays(counter.id, 7),
        getCounterIsActiveSinceDays(counter.id, 14),
        getCounterIsActiveSinceDays(counter.id, 30),
      ]);

      return {
        ...counter,
        states: {
          1: isActive1Day,
          2: isActive2Days,
          7: isActive7Days,
          14: isActive14Days,
          30: isActive30Days,
        },
        isActive: isActive2Days,
      };
    })
  );

  return (
    <MonitoringPageClient
      initialCounters={countersWithAllStates}
      initialMapStyle={mapStyle}
      initialGlobalDailyStats={globalDailyStats}
      defaultSelectedCounter={defaultSelectedCounter}
    />
  );
}
