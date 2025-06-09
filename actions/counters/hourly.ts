"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getStartOfWeekParis,
  getEndOfWeekParis,
} from "./dateHelpers";
import { PreloadedCounterData } from "@/types/counters/counters";
import { HourlyStatsDetailsTypes } from "@/types/counters/details";

export async function getHourlyStats(counterId: string) {
  const now = new Date();
  const today = now;
  const startOfWeek = getStartOfWeek(today);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const weekEnd = getEndOfDay(endOfWeek);

  // UNE SEULE REQUÊTE pour toute la semaine
  const weeklyStats = await prisma.$queryRaw<
    { day_of_week: number; hour: number; total: number }[]
  >(
    Prisma.sql`
      WITH weekly_stats AS (
        SELECT 
          EXTRACT(DOW FROM (date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))::integer as day_of_week,
          EXTRACT(HOUR FROM (date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))::integer as hour,
          SUM(value)::integer as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${getStartOfDay(startOfWeek)}
          AND date <= ${weekEnd}
        GROUP BY day_of_week, hour
      )
      SELECT 
        days.day_of_week,
        hours.hour,
        COALESCE(weekly_stats.total, 0) as total
      FROM (VALUES (1), (2), (3), (4), (5), (6), (0)) as days(day_of_week)
      CROSS JOIN generate_series(0, 23) as hours(hour)
      LEFT JOIN weekly_stats ON weekly_stats.day_of_week = days.day_of_week 
                            AND weekly_stats.hour = hours.hour
      ORDER BY days.day_of_week, hours.hour
    `
  );

  const days = [
    "monday",
    "tuesday", 
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  // Transformer les résultats en structure attendue
  const result = {} as PreloadedCounterData["hourlyStats"];
  
  days.forEach((day, index) => {
    // PostgreSQL DOW: 0=Sunday, 1=Monday, etc.
    const pgDayIndex = index === 6 ? 0 : index + 1;
    
    result[day as keyof PreloadedCounterData["hourlyStats"]] = weeklyStats
      .filter(stat => stat.day_of_week === pgDayIndex)
      .map(stat => ({
        hour: stat.hour,
        value: stat.total,
      }));
  });

  return result;
}

export async function getHourlyDetailsStats(counterId: string) {
  // Récupérer les bornes en une seule requête
  const boundaries = await prisma.counterTimeseries.aggregate({
    where: { counterId },
    _min: { date: true },
    _max: { date: true },
  });

  if (!boundaries._min.date || !boundaries._max.date) {
    return null;
  }

  const firstPassageParis = new Date(
    boundaries._min.date.toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );
  const lastPassageParis = new Date(
    boundaries._max.date.toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );

  const startYear = firstPassageParis.getFullYear();
  const endYear = lastPassageParis.getFullYear();

  // UNE SEULE REQUÊTE pour toutes les données
  const allData = await prisma.$queryRaw<
    { 
      year: number; 
      week: number; 
      day_of_week: number; 
      hour: number; 
      total: number;
      date: Date;
    }[]
  >(
    Prisma.sql`
      WITH all_stats AS (
        SELECT 
          EXTRACT(YEAR FROM (date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))::integer as year,
          EXTRACT(WEEK FROM (date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))::integer as week,
          EXTRACT(DOW FROM (date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))::integer as day_of_week,
          EXTRACT(HOUR FROM (date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))::integer as hour,
          (date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')::date as date,
          SUM(value)::integer as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${boundaries._min.date}
          AND date <= ${boundaries._max.date}
        GROUP BY year, week, day_of_week, hour, date
      )
      SELECT 
        year,
        week,
        day_of_week,
        hour,
        COALESCE(total, 0) as total,
        date
      FROM all_stats
      WHERE total > 0
      ORDER BY year, week, day_of_week, hour
    `
  );

  const days = [
    "monday",
    "tuesday",
    "wednesday", 
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as const;

  // Regrouper les données par année et semaine
  const groupedData = new Map<string, typeof allData>();
  
  allData.forEach(row => {
    const key = `${row.year}-${row.week}`;
    if (!groupedData.has(key)) {
      groupedData.set(key, []);
    }
    groupedData.get(key)!.push(row);
  });

  const allStats: HourlyStatsDetailsTypes[] = [];

  for (const [yearWeek, weekData] of groupedData) {
    const [year, week] = yearWeek.split('-').map(Number);
    
    // Calculer les dates de début et fin de semaine
    const weekStartDate = getWeekStartDate(year, week);
    const weekEndDate = getEndOfWeekParis(weekStartDate);

    // Vérifier si dans la plage
    if (weekStartDate > lastPassageParis || weekEndDate < firstPassageParis) {
      continue;
    }

    // Transformer les données pour cette semaine
    const hourlyStats = {} as Record<(typeof days)[number], any[]>;
    
    days.forEach((day, dayIndex) => {
      const pgDayIndex = dayIndex === 6 ? 0 : dayIndex + 1;
      
      // Créer un tableau de 24 heures avec toutes les valeurs à 0
      const dayStats = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        value: 0,
      }));

      // Remplir avec les vraies valeurs
      weekData
        .filter(row => row.day_of_week === pgDayIndex)
        .forEach(row => {
          if (row.hour >= 0 && row.hour <= 23) {
            dayStats[row.hour].value = row.total;
          }
        });

      hourlyStats[day] = dayStats;
    });

    allStats.push({
      year,
      week: {
        number: week,
        startDate: weekStartDate,
        endDate: weekEndDate,
        stats: hourlyStats,
      },
      availableYears: {
        start: startYear,
        end: endYear,
      },
    });
  }

  return allStats;
}

function getWeekStartDate(year: number, week: number): Date {
  const start = new Date(year, 0, 1);
  const weekStart = getStartOfWeekParis(start);
  const result = new Date(weekStart);
  result.setDate(result.getDate() + (week - 1) * 7);
  return result;
}