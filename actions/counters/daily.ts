"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

  // Calculer les moyennes
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

export async function getGlobalDailyStatsForYear() {
  const now = new Date();
  const currentYear = now.getFullYear();

  const startDate = new Date(`${currentYear}-01-01`);
  const endDate = new Date(`${currentYear}-12-31`);

  const result = await prisma.$queryRaw<{ day: string; value: number }[]>`
    WITH RECURSIVE dates AS (
      SELECT ${startDate}::date as date
      UNION ALL
      SELECT date + 1
      FROM dates
      WHERE date < ${endDate}::date
    )
    SELECT 
      dates.date::text as day,
      COALESCE(SUM(ct.value), 0)::integer as value
    FROM dates
    LEFT JOIN "CounterTimeseries" ct ON 
      date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = dates.date
    GROUP BY dates.date
    
    ORDER BY dates.date ASC
  `;

  const globalAverage =
    result.reduce((acc, curr) => acc + Number(curr.value), 0) / result.length;
  const activeDaysAverage =
    result.reduce((acc, curr) => acc + Number(curr.value), 0) /
    result.filter((d) => d.value > 0).length;

  return {
    year: result,
    globalAverage,
    activeDaysAverage,
  };
}
