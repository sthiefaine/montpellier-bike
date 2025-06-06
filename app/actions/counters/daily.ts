import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getDailyStatsForYear(counterId: string) {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  yearStart.setHours(1, 0, 0, 0);

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  today.setHours(1, 0, 0, 0);

  const endOfToday = new Date(today);
  endOfToday.setDate(today.getDate() + 1);
  endOfToday.setHours(0, 0, 0, 0);

  const stats = await prisma.$queryRaw<
    {
      day: string;
      total: bigint;
      global_average: number;
      active_days_average: number;
    }[]
  >(
    Prisma.sql`
      WITH dates AS (
        SELECT generate_series(
          ${yearStart}::timestamp,
          ${today}::timestamp,
          interval '1 day'
        )::date as day
      ),
      daily_stats AS (
        SELECT 
          dates.day,
          COALESCE(SUM(value), 0)::bigint as total
        FROM dates
        LEFT JOIN "CounterTimeseries" ON 
          "CounterTimeseries".date >= (dates.day + interval '1 hour') AT TIME ZONE 'Europe/Paris'
          AND "CounterTimeseries".date <= (dates.day + interval '1 day') AT TIME ZONE 'Europe/Paris'
          AND "CounterTimeseries"."counterId" = ${counterId}
        GROUP BY dates.day
      )
      SELECT 
        day,
        total,
        AVG(total) OVER () as global_average,
        AVG(CASE WHEN total > 0 THEN total END) OVER () as active_days_average
      FROM daily_stats
      ORDER BY day ASC
    `
  );

  const yearStats = stats.map((stat) => ({
    day: stat.day,
    value: Number(stat.total),
  }));

  return {
    year: yearStats,
    globalAverage: Math.round(Number(stats[0]?.global_average || 0)),
    activeDaysAverage: Math.round(Number(stats[0]?.active_days_average || 0)),
  };
}
