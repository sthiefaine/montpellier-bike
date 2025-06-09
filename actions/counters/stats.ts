"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  getBeforeYesterdayBoundsParis,
  getHoursOfDay,
  getYesterdayBoundsParis,
} from "./dateHelpers";
import { PreloadedCounterDetailsData } from "@/types/counters/details";

export async function getCounterStats(counterId: string): Promise<PreloadedCounterDetailsData['counterStats']> {
  const now = new Date();

  // Calcul des plages pour avant-hier et hier en heure de Paris
  const beforeYesterdayBounds = getBeforeYesterdayBoundsParis(now);
  const yesterdayBounds = getYesterdayBoundsParis(now);

  const [
    beforeYesterdayStats,
    yesterdayStats,
    firstPassage,
    lastPassage,
    lastPassageBeforeYesterday,
    lastPassageYesterday,
    totalPassages,
  ] = await Promise.all([
    prisma.$queryRaw<{ total: number }[]>(
      Prisma.sql`
        SELECT COALESCE(SUM(value), 0)::integer as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${beforeYesterdayBounds.start}
          AND date <= ${beforeYesterdayBounds.end}
      `
    ),
    prisma.$queryRaw<{ total: number }[]>(
      Prisma.sql`
        SELECT COALESCE(SUM(value), 0)::integer as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${yesterdayBounds.start}
          AND date <= ${yesterdayBounds.end}
      `
    ),
    // First passage
    prisma.counterTimeseries.findFirst({
      where: {
        counterId,
      },
      orderBy: {
        date: "asc",
      },
    }),
    // Last passage
    prisma.counterTimeseries.findFirst({
      where: {
        counterId,
      },
      orderBy: {
        date: "desc",
      },
    }),
    // Last passage before yesterday
    prisma.counterTimeseries.findFirst({
      where: {
        counterId,
        date: {
          gte: beforeYesterdayBounds.start,
          lte: beforeYesterdayBounds.end,
        },
      },
      orderBy: {
        date: "desc",
      },
    }),
    // Last passage yesterday
    prisma.counterTimeseries.findFirst({
      where: {
        counterId,
        date: {
          gte: yesterdayBounds.start,
          lt: yesterdayBounds.end,
        },
      },
      orderBy: {
        date: "desc",
      },
    }),
    // Total passages
    prisma.counterTimeseries.aggregate({
      where: {
        counterId,
      },
      _sum: {
        value: true,
      },
    }),
  ]);

  // Requête pour le jour avec le plus de passages
  const maxDay = await prisma.$queryRaw<{ day: string; total: number }[]>(
    Prisma.sql`
      WITH daily_stats AS (
        SELECT 
          DATE(date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as day,
          SUM(value)::integer as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
        GROUP BY DATE(date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')
      )
      SELECT day::text, total
      FROM daily_stats
      ORDER BY total DESC
      LIMIT 1
    `
  );

  return {
    beforeYesterday: Number(beforeYesterdayStats[0]?.total || 0),
    yesterday: Number(yesterdayStats[0]?.total || 0),
    firstPassageDate: firstPassage?.date || null,
    lastPassageDate: lastPassage?.date || null,
    lastPassageBeforeYesterday: lastPassageBeforeYesterday?.date || null,
    lastPassageYesterday: lastPassageYesterday?.date || null,
    totalPassages: Number(totalPassages._sum?.value || 0),
    maxDay: maxDay[0]
      ? {
          date: new Date(maxDay[0].day),
          value: Number(maxDay[0].total),
        }
      : null,
  };
}

/**
 * Récupère les données horaires pour une journée donnée
 * @param counterId ID du compteur
 * @param date Date de la journée (en heure de Paris)
 * @returns Données horaires avec index en UTC et labels en heure de Paris
 */
export async function getDayHourlyStats(counterId: string, date: Date) {
  const hoursParis = getHoursOfDay(date);

  const stats = await Promise.all(
    hoursParis.map(async (hourStart, index) => {
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000); // +1 heure

      const result = await prisma.counterTimeseries.aggregate({
        where: {
          counterId,
          date: {
            gte: hourStart,
            lt: hourEnd,
          },
        },
        _sum: {
          value: true,
        },
      });

      return {
        hour: index, // 0-23 en heure de Paris
        utcStart: hourStart,
        value: Number(result._sum?.value || 0),
      };
    })
  );

  return {
    index: stats.map((s) => s.utcStart.toISOString()),
    values: stats.map((s) => s.value),
    labels: stats.map((s) => `${s.hour}h`), // Labels en heure de Paris
  };
}

export async function getGlobalStats() {
  const firstPassage = await prisma.counterTimeseries.findFirst({
    orderBy: {
      date: "asc",
    },
  });

  const totalPassages = await prisma.counterTimeseries.aggregate({
    _sum: {
      value: true,
    },
  });

  const sinceDate = new Date();
  sinceDate.setUTCDate(sinceDate.getUTCDate() - 14);

  const activeCounters = await prisma.counterTimeseries.groupBy({
    by: ["counterId"],
    where: {
      date: {
        gte: sinceDate,
      },
    },
    _count: {
      counterId: true,
    },
  });

  const totalCounters = await prisma.bikeCounter.count();

  return {
    totalPassages: Number(totalPassages._sum?.value || 0),
    firstPassageDate: firstPassage?.date || null,
    totalCounters,
    activeCounters: activeCounters.length,
  };
}
