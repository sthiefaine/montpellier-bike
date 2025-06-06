import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getCounterStats(counterId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Pour avant-hier
  const startOfBeforeYesterday = new Date(today);
  startOfBeforeYesterday.setDate(startOfBeforeYesterday.getDate() - 2);
  startOfBeforeYesterday.setHours(1, 0, 0, 0);

  const endOfBeforeYesterday = new Date(today);
  endOfBeforeYesterday.setDate(endOfBeforeYesterday.getDate() - 1);
  endOfBeforeYesterday.setHours(0, 0, 0, 0);

  // Pour hier
  const startOfYesterday = new Date(today);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(1, 0, 0, 0);

  const endOfYesterday = new Date(today);
  endOfYesterday.setHours(0, 0, 0, 0);

  const [
    beforeYesterdayStats,
    yesterdayStats,
    firstPassage,
    lastPassage,
    lastPassageBeforeYesterday,
    lastPassageYesterday,
    totalPassages,
  ] = await Promise.all([
    // Before yesterday
    prisma.$queryRaw<{ total: bigint }[]>(
      Prisma.sql`
        WITH hourly_stats AS (
          SELECT 
            EXTRACT(HOUR FROM date)::integer as hour,
            SUM(value)::bigint as total
          FROM "CounterTimeseries"
          WHERE "counterId" = ${counterId}
            AND date >= ${startOfBeforeYesterday}
            AND date <= ${endOfBeforeYesterday}
          GROUP BY hour
        )
        SELECT COALESCE(SUM(total), 0) as total
        FROM hourly_stats
      `
    ),
    // Yesterday
    prisma.$queryRaw<{ total: bigint }[]>(
      Prisma.sql`
        WITH hourly_stats AS (
          SELECT 
            EXTRACT(HOUR FROM date)::integer as hour,
            SUM(value)::bigint as total
          FROM "CounterTimeseries"
          WHERE "counterId" = ${counterId}
            AND date >= ${startOfYesterday}
            AND date <= ${endOfYesterday}
          GROUP BY hour
        )
        SELECT COALESCE(SUM(total), 0)::bigint as total
        FROM hourly_stats
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
    prisma.$queryRaw<{ date: Date }[]>(
      Prisma.sql`
        SELECT date as date
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${startOfBeforeYesterday}
          AND date <= ${endOfBeforeYesterday}
        ORDER BY date DESC
        LIMIT 1
      `
    ),
    // Last passage yesterday
    prisma.$queryRaw<{ date: Date }[]>(
      Prisma.sql`
        SELECT date as date
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${startOfYesterday}
          AND date <= ${endOfYesterday}
        ORDER BY date DESC
        LIMIT 1
      `
    ),
    prisma.counterTimeseries.aggregate({
      where: {
        counterId,
      },
      _sum: {
        value: true,
      },
    }),
  ]);

  const [maxDay] = await prisma.$queryRaw<{ day: string; total: bigint }[]>(
    Prisma.sql`
      WITH first_date AS (
        SELECT MIN(date) as start_date
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
      ),
      dates AS (
        SELECT generate_series(
          date_trunc('day', (SELECT start_date FROM first_date)::timestamp),
          date_trunc('day', ${endOfYesterday}::timestamp),
          interval '1 day'
        )::date as day
      ),
      daily_stats AS (
        SELECT 
          dates.day::text as day,
          COALESCE(SUM(value), 0)::bigint as total
        FROM dates
        LEFT JOIN "CounterTimeseries" ON 
          "CounterTimeseries"."counterId" = ${counterId}
          AND "CounterTimeseries".date >= (dates.day + interval '1 hour') AT TIME ZONE 'Europe/Paris'
          AND "CounterTimeseries".date < (dates.day + interval '1 day' + interval '1 hour') AT TIME ZONE 'Europe/Paris'
        GROUP BY dates.day
      )
      SELECT day, total
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
    lastPassageBeforeYesterday: lastPassageBeforeYesterday[0]?.date || null,
    lastPassageYesterday: lastPassageYesterday[0]?.date || null,
    totalPassages: Number(totalPassages._sum?.value || 0),
    maxDay: maxDay
      ? {
          date: new Date(maxDay.day),
          value: Number(maxDay.total),
        }
      : null,
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
