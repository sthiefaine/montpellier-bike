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

  const stats = await Promise.all(
    Array.from(
      { length: endYear - startYear + 1 },
      (_, i) => startYear + i
    ).map(async (year) => {
      const yearToDateTotal = await prisma.counterTimeseries.aggregate({
        where: {
          counterId,
          date: {
            gte: new Date(year, 0, 1),
            lte: new Date(year, currentMonth, currentDay, 23, 59, 59),
          },
        },
        _sum: {
          value: true,
        },
      });

      const yearTotal = await prisma.counterTimeseries.aggregate({
        where: {
          counterId,
          date: {
            gte: new Date(year, 0, 1),
            lte: new Date(year, 11, 31, 23, 59, 59),
          },
        },
        _sum: {
          value: true,
        },
      });

      return {
        year,
        total: yearTotal._sum.value || 0,
        yearToDate: yearToDateTotal._sum.value || 0,
      };
    })
  );

  return stats;
}
