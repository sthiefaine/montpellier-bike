"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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

  const lastPassage = await prisma.counterTimeseries.findFirst({
    where: {
      counterId,
    },
    orderBy: {
      date: "desc",
    },
  });

  const startYear = firstPassage.date.getFullYear();
  const endYear = lastPassage?.date.getFullYear() || new Date().getFullYear();

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

export async function getYearlyProgressStats(counterId: string) {
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

  const lastPassage = await prisma.counterTimeseries.findFirst({
    where: {
      counterId,
    },
    orderBy: {
      date: "desc",
    },
  });

  const startYear = firstPassage.date.getFullYear();
  const endYear = lastPassage?.date.getFullYear() || new Date().getFullYear();
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  const stats = await prisma.$queryRaw<{ year: number; total: number; yearToDate: number }[]>(
    Prisma.sql`
      WITH years AS (
        SELECT generate_series(
          ${startYear}::integer,
          ${endYear}::integer
        ) as year
      ),
      yearly_stats AS (
        SELECT 
          years.year,
          COALESCE(SUM(CASE 
            WHEN EXTRACT(YEAR FROM date) = years.year 
            THEN value 
            ELSE 0 
          END), 0)::integer as total,
          COALESCE(SUM(CASE 
            WHEN EXTRACT(YEAR FROM date) = years.year 
            AND EXTRACT(MONTH FROM date) <= ${currentMonth + 1}
            AND EXTRACT(DAY FROM date) <= ${currentDay}
            THEN value 
            ELSE 0 
          END), 0)::integer as year_to_date
        FROM years
        LEFT JOIN "CounterTimeseries" ON 
          "CounterTimeseries"."counterId" = ${counterId}
          AND EXTRACT(YEAR FROM "CounterTimeseries".date) = years.year
        GROUP BY years.year
      )
      SELECT 
        year,
        total,
        year_to_date as "yearToDate"
      FROM yearly_stats
      ORDER BY year
    `
  );

  return stats;
}
