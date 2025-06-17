"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  DailyDataPoint,
  CounterGlobalDailyStats,
} from "@/types/counters/counters";

export async function getDailyStatsForYear(counterId: string) {
  const now = new Date();
  const currentYear = now.getFullYear();

  const startOfYear = `${currentYear}-01-01`;
  const endOfYear = `${currentYear}-12-31`;

  const dailyStats = await prisma.$queryRaw<{ day: string; total: number }[]>(
    Prisma.sql`
      WITH dates AS (
        SELECT generate_series(
          ${startOfYear}::date,
          ${endOfYear}::date,
          interval '1 day'
        )::date as day
      ),
      daily_stats AS (
        SELECT 
          dates.day as day,
          COALESCE(SUM(value), 0)::integer as total
        FROM dates
        LEFT JOIN "CounterTimeseries" ON 
          "CounterTimeseries"."counterId" = ${counterId}
          AND date_trunc('day', "CounterTimeseries".date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = dates.day
        GROUP BY dates.day
      )
      SELECT day::text as day, total
      FROM daily_stats
      WHERE day < (NOW() AT TIME ZONE 'Europe/Paris')::date
      ORDER BY day
    `
  );

  const filteredStats = dailyStats.map((stat) => ({
    day: stat.day,
    value: stat.total,
  }));

  const total = filteredStats.reduce((acc, stat) => acc + stat.value, 0);
  const activeDays = filteredStats.filter((stat) => stat.value > 0).length;
  const globalAverage = total / filteredStats.length;
  const activeDaysAverage = activeDays > 0 ? total / activeDays : 0;

  return {
    year: filteredStats,
    globalAverage,
    activeDaysAverage,
  };
}

export async function getGlobalDailyStatsForYear(): Promise<CounterGlobalDailyStats> {
  const now = new Date();
  const currentYear = now.getFullYear();
  const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const startDate = `${currentYear}-01-01`;
  const endDate = `${currentYear}-12-31`;

  const result = await prisma.$queryRaw<DailyDataPoint[]>(
    Prisma.sql`
      WITH dates AS (
        SELECT generate_series(
          ${startDate}::date,
          ${endDate}::date,
          interval '1 day'
        )::date as date
      )
      SELECT 
        dates.date::text as day,
        COALESCE(SUM(ct.value), 0)::integer as value
      FROM dates
      LEFT JOIN "CounterTimeseries" ct ON 
        date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = dates.date
      WHERE dates.date <= ${today}::date
      GROUP BY dates.date
      ORDER BY dates.date ASC
    `
  );

  const filteredResult = filterConsecutiveZeros(result, 2);

  const dailyTotals = filteredResult.reduce((acc, curr) => {
    const date = new Date(curr.day);
    const dayOfWeek = date.getDay();
    const dayName = dayNames[dayOfWeek];

    if (!acc[dayName]) {
      acc[dayName] = { total: 0, count: 0 };
    }

    acc[dayName].total += curr.value;
    acc[dayName].count += 1;

    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const formattedTotals = Object.entries(dailyTotals).map(([day, data]) => ({
    day,
    value: data.total,
    count: data.count,
  }));

  formattedTotals.sort(
    (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  );

  // Calculer la moyenne des totaux quotidiens
  const totalValue = formattedTotals.reduce((sum, curr) => sum + curr.value, 0);
  const globalAverage = Math.round(totalValue / formattedTotals.length);

  return {
    dailyTotals: formattedTotals,
    globalAverage,
    totalDays: filteredResult.length,
    originalDays: result.length,
    filteredDays: result.length - filteredResult.length,
  };
}

// Fonction pour filtrer les périodes de plus de N jours consécutifs à zéro
function filterConsecutiveZeros(
  data: DailyDataPoint[],
  maxConsecutiveZeros: number
): DailyDataPoint[] {
  const result = [];
  let consecutiveZeros = 0;
  let zeroStreak = [];

  for (let i = 0; i < data.length; i++) {
    const current = data[i];

    if (current.value === 0) {
      consecutiveZeros++;
      zeroStreak.push(i);
    } else {
      if (consecutiveZeros > maxConsecutiveZeros) {
        // Ne pas ajouter les jours de la série problématique
      } else {
        for (const idx of zeroStreak) {
          result.push(data[idx]);
        }
      }

      consecutiveZeros = 0;
      zeroStreak = [];
      result.push(current);
    }
  }

  // Traiter la dernière série si elle se termine par des zéros
  if (consecutiveZeros > 0) {
    if (consecutiveZeros <= maxConsecutiveZeros) {
      for (const idx of zeroStreak) {
        result.push(data[idx]);
      }
    } else {
      console.log(
        `Période problématique détectée en fin: ${consecutiveZeros} jours consécutifs à zéro du ${
          data[zeroStreak[0]].day
        } au ${data[zeroStreak[zeroStreak.length - 1]].day}`
      );
    }
  }

  return result;
}
