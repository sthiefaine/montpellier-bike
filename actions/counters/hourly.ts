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

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const stats = await Promise.all(
    days.map(async (day) => {
      const dayIndex = days.indexOf(day);
      const startDate = new Date(startOfWeek);
      startDate.setDate(startOfWeek.getDate() + dayIndex);
      const dayStart = getStartOfDay(startDate);
      const dayEnd = getEndOfDay(startDate);

      const hourlyStats = await prisma.$queryRaw<
        { hour: number; total: number }[]
      >(
        Prisma.sql`
          WITH hourly_stats AS (
            SELECT 
              EXTRACT(HOUR FROM (date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))::integer as hour,
              SUM(value)::integer as total
            FROM "CounterTimeseries"
            WHERE "counterId" = ${counterId}
              AND date >= ${dayStart}
              AND date <= ${dayEnd}
            GROUP BY hour
          )
          SELECT 
            hour,
            COALESCE(total, 0) as total
          FROM generate_series(0, 23) as hours
          LEFT JOIN hourly_stats ON hourly_stats.hour = hours
          ORDER BY hour
        `
      );

      return {
        day,
        stats: hourlyStats.map((stat) => ({
          hour: stat.hour,
          value: stat.total,
        })),
      };
    })
  );

  return stats.reduce((acc, { day, stats }) => {
    acc[day as keyof PreloadedCounterData["hourlyStats"]] = stats;
    return acc;
  }, {} as PreloadedCounterData["hourlyStats"]);
}

export async function getHourlyDetailsStats(counterId: string) {
  const [firstPassage, lastPassage] = await Promise.all([
    prisma.counterTimeseries.findFirst({
      where: { counterId },
      orderBy: { date: "asc" },
      select: { date: true },
    }),
    prisma.counterTimeseries.findFirst({
      where: { counterId },
      orderBy: { date: "desc" },
      select: { date: true },
    }),
  ]);

  if (!firstPassage || !lastPassage) {
    return null;
  }

  const firstPassageParis = new Date(
    firstPassage.date.toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );
  const lastPassageParis = new Date(
    lastPassage.date.toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );

  const startYear = firstPassageParis.getFullYear();
  const endYear = lastPassageParis.getFullYear();

  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ] as const;

  const allStats: HourlyStatsDetailsTypes[] = [];

  for (let year = startYear; year <= endYear; year++) {
    const lastDayOfYear = new Date(year, 11, 31);
    const firstDayOfYear = new Date(year, 0, 1);
    const totalWeeks = Math.ceil(
      (lastDayOfYear.getTime() - firstDayOfYear.getTime()) /
        (7 * 24 * 60 * 60 * 1000)
    );

    for (let week = 1; week <= totalWeeks; week++) {
      const weekStartDate = getWeekStartDate(year, week);
      const weekEndDate = getEndOfWeekParis(weekStartDate);

      if (weekStartDate > lastPassageParis || weekEndDate < firstPassageParis) {
        continue;
      }

      const stats = await Promise.all(
        days.map(async (day, dayIndex) => {
          // Calculer la date du jour en tenant compte du décalage lundi-dimanche
          const dayStart = new Date(weekStartDate);
          dayStart.setDate(dayStart.getDate() + dayIndex);

          // Formater la date au format YYYY-MM-DD
          const year = dayStart.getFullYear();
          const month = String(dayStart.getMonth() + 1).padStart(2, "0");
          const dayStr = String(dayStart.getDate()).padStart(2, "0");
          const dateStr = `${year}-${month}-${dayStr}`;

          const hourlyStats = await prisma.$queryRaw<
            { hour: number; total: number }[]
          >(
            Prisma.sql`
              WITH hourly_stats AS (
                SELECT 
                  EXTRACT(HOUR FROM (date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))::integer as hour,
                  SUM(value)::integer as total
                FROM "CounterTimeseries"
                WHERE "counterId" = ${counterId}
                  AND (date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')::date = ${dateStr}::date
                GROUP BY hour
              )
              SELECT 
                hours as hour,
                COALESCE(total, 0) as total
              FROM generate_series(0, 23) as hours 
              LEFT JOIN hourly_stats ON hourly_stats.hour = hours
              ORDER BY hours
            `
          );

          return {
            day,
            stats: hourlyStats.map((stat) => ({
              hour: stat.hour,
              value: stat.total,
            })),
          };
        })
      );

      const hourlyStats = stats.reduce((acc, { day, stats }) => {
        acc[day] = stats;
        return acc;
      }, {} as Record<(typeof days)[number], (typeof stats)[number]["stats"]>);

      // Vérifier si la semaine a des données
      const hasData = Object.values(hourlyStats).some((dayStats) =>
        dayStats.some((stat) => stat.value > 0)
      );

      if (hasData) {
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
    }
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

