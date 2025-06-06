import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getYearlyStats(counterId: string) {
  const now = new Date();
  const firstDate = await prisma.counterTimeseries.findFirst({
    where: {
      counterId,
    },
    orderBy: {
      date: "asc",
    },
    select: {
      date: true,
    },
  });

  if (!firstDate) {
    return [];
  }

  const yearStart = new Date(firstDate.date);
  yearStart.setHours(1, 0, 0, 0);

  const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
  yearEnd.setHours(1, 0, 0, 0);

  const stats = await prisma.$queryRaw<{ year: number; total: bigint }[]>(
    Prisma.sql`
      WITH dates AS (
        SELECT generate_series(
          date_trunc('year', ${yearStart}::timestamp),
          date_trunc('year', ${yearEnd}::timestamp),
          interval '1 year'
        )::date as year_start
      )
      SELECT 
        EXTRACT(YEAR FROM dates.year_start)::integer as year,
        COALESCE(SUM(value), 0)::bigint as total
      FROM dates
      LEFT JOIN "CounterTimeseries" ON 
        EXTRACT(YEAR FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = EXTRACT(YEAR FROM dates.year_start)
        AND "CounterTimeseries"."counterId" = ${counterId}
      GROUP BY dates.year_start
      ORDER BY dates.year_start ASC
    `
  );

  return stats.map((stat) => ({
    year: stat.year,
    total: Number(stat.total),
  }));
}