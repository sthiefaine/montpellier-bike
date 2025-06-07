import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  getStartOfDayUTC,
  getEndOfDayUTC,
  toParisTime,
  getHoursOfDayUTC,
} from "./dateHelpers";

export async function getCounterStats(counterId: string) {
  const now = new Date(); // Date UTC actuelle
  const today = toParisTime(now); // Convertie en heure de Paris

  // Calcul des plages pour avant-hier et hier en UTC
  const beforeYesterday = new Date(today);
  beforeYesterday.setDate(beforeYesterday.getDate() - 2);
  beforeYesterday.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  // Conversion en UTC pour les requêtes
  const startOfBeforeYesterdayUTC = getStartOfDayUTC(beforeYesterday);
  const endOfBeforeYesterdayUTC = getEndOfDayUTC(beforeYesterday);
  const startOfYesterdayUTC = getStartOfDayUTC(yesterday);
  const endOfYesterdayUTC = getEndOfDayUTC(yesterday);

  if (counterId === "cmb1c3kk8000lv3xm3hhur5jk") {
    console.log("Debug dates:");
    console.log("now (UTC):", now);
    console.log("today (Paris):", today);
    console.log("beforeYesterday (Paris):", beforeYesterday);
    console.log("yesterday (Paris):", yesterday);
    console.log("startOfBeforeYesterdayUTC:", startOfBeforeYesterdayUTC);
    console.log("endOfBeforeYesterdayUTC:", endOfBeforeYesterdayUTC);
    console.log("startOfYesterdayUTC:", startOfYesterdayUTC);
    console.log("endOfYesterdayUTC:", endOfYesterdayUTC);
  }

  const [
    beforeYesterdayStats,
    yesterdayStats,
    firstPassage,
    lastPassage,
    lastPassageBeforeYesterday,
    lastPassageYesterday,
    totalPassages,
  ] = await Promise.all([
    // Before yesterday - requête simplifiée
    prisma.$queryRaw<{ total: number }[]>(
      Prisma.sql`
        SELECT COALESCE(SUM(value), 0)::integer as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${startOfBeforeYesterdayUTC}
          AND date < ${endOfBeforeYesterdayUTC}
      `
    ),
    // Yesterday - requête simplifiée
    prisma.$queryRaw<{ total: number }[]>(
      Prisma.sql`
        SELECT COALESCE(SUM(value), 0)::integer as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${startOfYesterdayUTC}
          AND date < ${endOfYesterdayUTC}
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
          gte: startOfBeforeYesterdayUTC,
          lt: endOfBeforeYesterdayUTC,
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
          gte: startOfYesterdayUTC,
          lt: endOfYesterdayUTC,
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
    debug: {
      startOfBeforeYesterdayUTC,
      endOfBeforeYesterdayUTC,
      startOfYesterdayUTC,
      endOfYesterdayUTC,
    },
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
  const hoursUTC = getHoursOfDayUTC(date);

  const stats = await Promise.all(
    hoursUTC.map(async (hourStart, index) => {
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
