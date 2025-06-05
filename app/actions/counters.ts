"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { BikeCounter } from "@prisma/client";

export async function getCounters(): Promise<BikeCounter[]> {
  const counters = await prisma.bikeCounter.findMany();
  return counters;
}

export async function getCounterStats(counterId: string) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const startOfYesterday = new Date();
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0);

  const endOfYesterday = new Date();
  endOfYesterday.setDate(endOfYesterday.getDate() - 1);
  endOfYesterday.setHours(23, 59, 59, 999);

  const [
    yesterdayStats,
    todayStats,
    firstPassage,
    lastPassage,
    lastPassageYesterday,
    lastPassageToday,
    totalPassages,
  ] = await Promise.all([
    prisma.counterTimeseries.aggregate({
      where: {
        counterId,
        date: {
          gte: yesterday,
          lt: today,
        },
      },
      _sum: {
        value: true,
      },
    }),
    prisma.counterTimeseries.aggregate({
      where: {
        counterId,
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      _sum: {
        value: true,
      },
    }),
    prisma.counterTimeseries.findFirst({
      where: {
        counterId,
      },
      orderBy: {
        date: "asc",
      },
    }),
    prisma.counterTimeseries.findFirst({
      where: {
        counterId,
      },
      orderBy: {
        date: "desc",
      },
    }),
    prisma.counterTimeseries.findFirst({
      where: {
        counterId,
        date: {
          gte: startOfYesterday,
          lte: endOfYesterday,
        },
      },
      orderBy: {
        date: "desc",
      },
    }),
    prisma.counterTimeseries.findFirst({
      where: {
        counterId,
        date: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: {
        date: "desc",
      },
    }),
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
      SELECT DATE(date)::text as day, SUM(value)::bigint as total
      FROM "CounterTimeseries"
      WHERE "counterId" = ${counterId} AND date <= ${today}
      GROUP BY DATE(date)
      ORDER BY total DESC
      LIMIT 1
    `
  );

  return {
    yesterday: Number(yesterdayStats._sum?.value || 0),
    today: Number(todayStats._sum?.value || 0),
    firstPassageDate: firstPassage?.date || null,
    lastPassageDate: lastPassage?.date || null,
    lastPassageYesterday: lastPassageYesterday?.date || null,
    lastPassageToday: lastPassageToday?.date || null,
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
  sinceDate.setDate(sinceDate.getDate() - 14);

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

export async function getCountersStatus() {
  const sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 14);

  const activeCounters = await prisma.counterTimeseries.groupBy({
    by: ["counterId"],
    where: {
      date: {
        gte: sinceDate,
      },
    },
  });

  const activeCounterIds = new Set(activeCounters.map((c) => c.counterId));

  return activeCounterIds;
}

export async function getYearlyStats(counterId: string) {
  const stats = await prisma.$queryRaw<{ year: number; total: bigint }[]>(
    Prisma.sql`
      SELECT 
        EXTRACT(YEAR FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')::integer as year,
        SUM(value)::bigint as total
      FROM "CounterTimeseries"
      WHERE "counterId" = ${counterId}
      GROUP BY year
      ORDER BY year ASC
    `
  );

  return stats.map((stat) => ({
    year: stat.year,
    total: Number(stat.total),
  }));
}

export async function getHourlyStats(counterId: string) {
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(today.getDate() - diff);

  const [
    mondayStats,
    tuesdayStats,
    wednesdayStats,
    thursdayStats,
    fridayStats,
    saturdayStats,
    sundayStats,
  ] = await Promise.all([
    prisma.$queryRaw<{ hour: number; total: bigint }[]>(
      Prisma.sql`
        SELECT 
          EXTRACT(HOUR FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')::integer as hour,
          COALESCE(SUM(value), 0)::bigint as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${startOfWeek}
          AND date < ${new Date(startOfWeek.getTime() + 24 * 60 * 60 * 1000)}
        GROUP BY hour
        ORDER BY hour ASC
      `
    ),
    prisma.$queryRaw<{ hour: number; total: bigint }[]>(
      Prisma.sql`
        SELECT 
          EXTRACT(HOUR FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')::integer as hour,
          COALESCE(SUM(value), 0)::bigint as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${new Date(startOfWeek.getTime() + 24 * 60 * 60 * 1000)}
          AND date < ${new Date(
            startOfWeek.getTime() + 2 * 24 * 60 * 60 * 1000
          )}
        GROUP BY hour
        ORDER BY hour ASC
      `
    ),
    prisma.$queryRaw<{ hour: number; total: bigint }[]>(
      Prisma.sql`
        SELECT 
          EXTRACT(HOUR FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')::integer as hour,
          COALESCE(SUM(value), 0)::bigint as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${new Date(
            startOfWeek.getTime() + 2 * 24 * 60 * 60 * 1000
          )}
          AND date < ${new Date(
            startOfWeek.getTime() + 3 * 24 * 60 * 60 * 1000
          )}
        GROUP BY hour
        ORDER BY hour ASC
      `
    ),
    prisma.$queryRaw<{ hour: number; total: bigint }[]>(
      Prisma.sql`
        SELECT 
          EXTRACT(HOUR FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')::integer as hour,
          COALESCE(SUM(value), 0)::bigint as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${new Date(
            startOfWeek.getTime() + 3 * 24 * 60 * 60 * 1000
          )}
          AND date < ${new Date(
            startOfWeek.getTime() + 4 * 24 * 60 * 60 * 1000
          )}
        GROUP BY hour
        ORDER BY hour ASC
      `
    ),
    prisma.$queryRaw<{ hour: number; total: bigint }[]>(
      Prisma.sql`
        SELECT 
          EXTRACT(HOUR FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')::integer as hour,
          COALESCE(SUM(value), 0)::bigint as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${new Date(
            startOfWeek.getTime() + 4 * 24 * 60 * 60 * 1000
          )}
          AND date < ${new Date(
            startOfWeek.getTime() + 5 * 24 * 60 * 60 * 1000
          )}
        GROUP BY hour
        ORDER BY hour ASC
      `
    ),
    prisma.$queryRaw<{ hour: number; total: bigint }[]>(
      Prisma.sql`
        SELECT 
          EXTRACT(HOUR FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')::integer as hour,
          COALESCE(SUM(value), 0)::bigint as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${new Date(
            startOfWeek.getTime() + 5 * 24 * 60 * 60 * 1000
          )}
          AND date < ${new Date(
            startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000
          )}
        GROUP BY hour
        ORDER BY hour ASC
      `
    ),
    prisma.$queryRaw<{ hour: number; total: bigint }[]>(
      Prisma.sql`
        SELECT 
          EXTRACT(HOUR FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')::integer as hour,
          COALESCE(SUM(value), 0)::bigint as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${new Date(
            startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000
          )}
          AND date < ${new Date(
            startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000
          )}
        GROUP BY hour
        ORDER BY hour ASC
      `
    ),
  ]);

  const formatHourlyData = (stats: { hour: number; total: bigint }[]) => {
    const hourlyData = Array(24)
      .fill(0)
      .map((_, hour) => ({
        hour,
        value: 0,
      }));

    stats.forEach((stat) => {
      hourlyData[stat.hour].value = Number(stat.total);
    });

    return hourlyData;
  };

  return {
    monday: formatHourlyData(mondayStats),
    tuesday: formatHourlyData(tuesdayStats),
    wednesday: formatHourlyData(wednesdayStats),
    thursday: formatHourlyData(thursdayStats),
    friday: formatHourlyData(fridayStats),
    saturday: formatHourlyData(saturdayStats),
    sunday: formatHourlyData(sundayStats),
  };
}

export async function getWeeklyStats(counterId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(today.getDate() - diff);

  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const [currentWeekStats, lastWeekStats] = await Promise.all([
    prisma.$queryRaw<{ day: string; total: bigint }[]>(
      Prisma.sql`
        SELECT 
          DATE(date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')::text as day,
          COALESCE(SUM(value), 0)::bigint as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${startOfWeek}
          AND date <= ${today}
        GROUP BY day
        ORDER BY day ASC
      `
    ),
    prisma.$queryRaw<{ day: string; total: bigint }[]>(
      Prisma.sql`
        SELECT 
          DATE(date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')::text as day,
          COALESCE(SUM(value), 0)::bigint as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${startOfLastWeek}
          AND date < ${startOfWeek}
        GROUP BY day
        ORDER BY day ASC
      `
    ),
  ]);

  const formatWeeklyData = (
    stats: { day: string; total: bigint }[],
    startDate: Date,
    endDate: Date
  ) => {
    const weeklyData = [
      { day: "lun", value: null as number | null },
      { day: "mar", value: null as number | null },
      { day: "mer", value: null as number | null },
      { day: "jeu", value: null as number | null },
      { day: "ven", value: null as number | null },
      { day: "sam", value: null as number | null },
      { day: "dim", value: null as number | null },
    ];

    stats.forEach((stat) => {
      const date = new Date(stat.day);
      const dayOfWeek = date.getDay();
      const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      const value = Number(stat.total);

      if (weeklyData[index].value !== null && value !== null) {
        weeklyData[index].value = weeklyData[index].value! + value;
      } else {
        weeklyData[index].value = value;
      }
    });

    return weeklyData;
  };

  const calculateAverage = (
    weeklyData: { day: string; value: number | null }[]
  ) => {
    const validDays = weeklyData.filter(
      (day) => day.value !== null && day.value !== 0
    );
    if (validDays.length === 0) return 0;

    const total = validDays.reduce((sum, day) => sum + day.value!, 0);
    return Math.round(total / validDays.length);
  };

  const currentWeekData = formatWeeklyData(
    currentWeekStats,
    startOfWeek,
    today
  );
  const lastWeekData = formatWeeklyData(
    lastWeekStats,
    startOfLastWeek,
    new Date(startOfWeek.getTime() - 1)
  );

  const currentWeekAverage = calculateAverage(currentWeekData);
  const lastWeekAverage = calculateAverage(lastWeekData);
  const globalAverage = Math.round((currentWeekAverage + lastWeekAverage) / 2);

  return {
    currentWeek: currentWeekData,
    lastWeek: lastWeekData,
    currentWeekAverage,
    lastWeekAverage,
    globalAverage,
  };
}

export async function getDailyStatsForYear(counterId: string) {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const today = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );
  today.setHours(0, 0, 0, 0);

  const stats = await prisma.$queryRaw<{ day: string; total: bigint }[]>(
    Prisma.sql`
      WITH dates AS (
        SELECT generate_series(
          ${yearStart}::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris',
          ${today}::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris',
          interval '1 day'
        )::date as day
      )
      SELECT 
        dates.day,
        COALESCE(SUM(value), 0)::bigint as total
      FROM dates
      LEFT JOIN "CounterTimeseries" ON DATE("CounterTimeseries".date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = dates.day
        AND "CounterTimeseries"."counterId" = ${counterId}
      GROUP BY dates.day
      ORDER BY dates.day ASC
    `
  );

  return stats.map((stat) => ({
    day: stat.day,
    value: Number(stat.total),
  }));
}
