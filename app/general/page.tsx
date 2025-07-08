"use server";
import { cache } from "react";
import {
  getGlobalDailyStatsForYear,
  getGlobalDailyStatsForPeriod,
  getGlobalEvolutionStatsForPeriods,
  getDailyDistributionStats,
  getHourlyDistributionStatsWithFilter,
  getAvailableYears,
} from "@/actions/counters/daily";
import GeneralPageClient from "./GeneralPageClient";

// Fonction pour précharger toutes les données
const preloadGeneralData = cache(
  async (
    startDate: string,
    endDate: string,
    startDate2: string,
    endDate2: string
  ) => {
    const year = new Date(startDate).getFullYear().toString();

    const [
      dailyData,
      periodData,
      evolutionData,
      distributionData,
      hourlyDataGlobal,
      hourlyDataWeek,
      hourlyDataWeekend,
      yearsData,
    ] = await Promise.all([
      getGlobalDailyStatsForYear(year),
      getGlobalDailyStatsForPeriod(startDate, endDate),
      getGlobalEvolutionStatsForPeriods(
        startDate,
        endDate,
        startDate2,
        endDate2
      ),
      getDailyDistributionStats(startDate, endDate),
      getHourlyDistributionStatsWithFilter(startDate, endDate, "global"),
      getHourlyDistributionStatsWithFilter(startDate, endDate, "week"),
      getHourlyDistributionStatsWithFilter(startDate, endDate, "weekend"),
      getAvailableYears(),
    ]);

    return {
      dailyData,
      periodData,
      evolutionData,
      distributionData,
      hourlyDataGlobal,
      hourlyDataWeek,
      hourlyDataWeekend,
      yearsData,
    };
  }
);

export default async function GeneralPage() {
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  // Utiliser l'année courante comme période par défaut
  const defaultYear = currentYear;
  const defaultPreviousYear = previousYear;

  // Périodes par défaut
  const startDate = `${defaultYear}-01-01`;
  const endDate = `${defaultYear}-12-31`;
  const startDate2 = `${defaultPreviousYear}-01-01`;
  const endDate2 = `${defaultPreviousYear}-12-31`;

  // Précharger toutes les données
  const preloadedData = await preloadGeneralData(
    startDate,
    endDate,
    startDate2,
    endDate2
  );

  return (
    <GeneralPageClient
      preloadedData={preloadedData}
      defaultStartDate={startDate}
      defaultEndDate={endDate}
      defaultStartDate2={startDate2}
      defaultEndDate2={endDate2}
      defaultYear={defaultYear}
      defaultPreviousYear={defaultPreviousYear}
    />
  );
}
