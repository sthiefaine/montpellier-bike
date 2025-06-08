import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  getStartOfMonth,
  getEndOfMonth,
  getStartOfDay,
  getEndOfDay,
  getStartOfYear,
  getEndOfYear,
} from "./dateHelpers";

export async function getDailyStatsForYear(counterId: string) {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Créer les dates directement sans passer par les helpers
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
