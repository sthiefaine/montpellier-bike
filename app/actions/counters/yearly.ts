import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getEndOfYear } from "./dateHelpers";

export async function getYearlyStats(counterId: string) {
  const firstPassage = await prisma.counterTimeseries.findFirst({
    where: {
      counterId,
    },
    orderBy: {
      date: "asc",
    },
  });

  if (!firstPassage) {
    return [];
  }

  const startYear = firstPassage.date.getFullYear();
  const endYear = getEndOfYear(firstPassage.date).getFullYear();

  const yearlyStats = await prisma.$queryRaw<{ year: string; total: bigint }[]>(
    Prisma.sql`
      WITH years AS (
        SELECT generate_series(
          ${startYear}::integer,
          ${endYear}::integer
        ) as year
      ),
      yearly_stats AS (
        SELECT 
          years.year::text as year,
          COALESCE(SUM(value), 0)::bigint as total
        FROM years
        LEFT JOIN "CounterTimeseries" ON 
          "CounterTimeseries"."counterId" = ${counterId}
          AND EXTRACT(YEAR FROM "CounterTimeseries".date) = years.year
        GROUP BY years.year
      )
      SELECT year, total
      FROM yearly_stats
      ORDER BY year
    `
  );

  return yearlyStats.map((stat: { year: string; total: bigint }) => ({
    year: parseInt(stat.year),
    total: Number(stat.total),
  }));
}
