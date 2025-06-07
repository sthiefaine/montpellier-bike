import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getStartOfMonth, getEndOfMonth, getStartOfDay, getEndOfDay } from "./dateHelpers";

export async function getDailyStatsForYear(counterId: string) {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const endOfYear = new Date(now.getFullYear(), 11, 31);

  const dailyStats = await prisma.$queryRaw<{ day: string; total: number }[]>(
    Prisma.sql`
      WITH dates AS (
        SELECT generate_series(
          date_trunc('day', ${getStartOfMonth(startOfYear)}),
          date_trunc('day', ${getEndOfMonth(endOfYear)}),
          interval '1 day'
        )::date as day
      ),
      daily_stats AS (
        SELECT 
          dates.day::text as day,
          COALESCE(SUM(value), 0)::integer as total
        FROM dates
        LEFT JOIN "CounterTimeseries" ON 
          "CounterTimeseries"."counterId" = ${counterId}
          AND date_trunc('day', "CounterTimeseries".date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = dates.day
        GROUP BY dates.day
      )
      SELECT day, total
      FROM daily_stats
      ORDER BY day
    `
  );

  const today = getStartOfDay((new Date()));
  const filteredStats = dailyStats
    .filter(stat => new Date(stat.day).getTime() < today.getTime())
    .map(stat => ({
      day: stat.day,
      value: stat.total
    }));

  // Calculer les moyennes
  const total = filteredStats.reduce((acc, stat) => acc + stat.value, 0);
  const activeDays = filteredStats.filter(stat => stat.value > 0).length;
  const globalAverage = total / filteredStats.length;
  const activeDaysAverage = activeDays > 0 ? total / activeDays : 0;

  return {
    year: filteredStats,
    globalAverage,
    activeDaysAverage,
  };
}
