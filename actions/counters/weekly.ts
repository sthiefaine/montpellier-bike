"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  getStartOfWeek,
  getEndOfWeek,
  getStartOfYearParis,
  getEndOfYearParis,
} from "./dateHelpers";

export async function getWeeklyStats(counterId: string) {
  const now = new Date();
  const today = now;

  const startOfWeek = getStartOfWeek(today);
  const endOfWeek = getEndOfWeek(today);

  const startOfLastWeek = new Date(startOfWeek);
  startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

  const endOfLastWeek = new Date(endOfWeek);
  endOfLastWeek.setDate(endOfLastWeek.getDate() - 7);

  const [currentWeekStats, lastWeekStats] = await Promise.all([
    prisma.$queryRaw<{ day: string; total: number }[]>(
      Prisma.sql`
        WITH daily_stats AS (
          SELECT 
            (DATE(date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))::text as day,
            SUM(value)::integer as total
          FROM "CounterTimeseries"
          WHERE "counterId" = ${counterId}
            AND date >= ${startOfWeek}
            AND date <= ${endOfWeek}
          GROUP BY (DATE(date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))
        )
        SELECT day, total
        FROM daily_stats
        ORDER BY day ASC
      `
    ),
    prisma.$queryRaw<{ day: string; total: number }[]>(
      Prisma.sql`
        WITH daily_stats AS (
          SELECT 
            (DATE(date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))::text as day,
            SUM(value)::integer as total
          FROM "CounterTimeseries"
          WHERE "counterId" = ${counterId}
            AND date >= ${startOfLastWeek}
            AND date <= ${endOfLastWeek}
          GROUP BY (DATE(date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))
        )
        SELECT day, total
        FROM daily_stats
        ORDER BY day ASC
      `
    ),
  ]);

  const formatWeeklyData = (
    stats: { day: string; total: number }[],
    isCurrentWeek: boolean = false
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

      if (isCurrentWeek) {
        const todayDayOfWeek = today.getDay();
        const todayIndex = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;
        if (index > todayIndex) {
          return;
        }
      }

      const value = stat.total;

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

  const currentWeekData = formatWeeklyData(currentWeekStats, true);
  const lastWeekData = formatWeeklyData(lastWeekStats);

  const currentWeekAverage = calculateAverage(currentWeekData);
  const lastWeekAverage = calculateAverage(lastWeekData);
  const globalAverage = Math.round((currentWeekAverage + lastWeekAverage) / 2);

  const filteredCurrentWeekData = currentWeekData.filter(
    (day) =>
      day.day !==
      today
        .toLocaleDateString("fr-FR", { weekday: "long" })
        .toLowerCase()
        .slice(0, 3)
  );

  return {
    currentWeek: filteredCurrentWeekData,
    lastWeek: lastWeekData,
    currentWeekAverage,
    lastWeekAverage,
    globalAverage,
  };
}

export async function getGlobalWeeklyStatsForYear(year?: string) {
  const selectedYear = year ? parseInt(year) : new Date().getFullYear();
  const now = new Date();

  const startDate = `${selectedYear}-01-01`;
  const endDate = `${selectedYear}-12-31`;

  const result = await prisma.$queryRaw<{ week: string; value: number }[]>`
    WITH RECURSIVE weeks AS (
      SELECT date_trunc('week', ${startDate}::date) + interval '1 day' as week_start
      UNION ALL
      SELECT week_start + interval '1 week'
      FROM weeks
      WHERE week_start < ${endDate}::date
    ),
    daily_totals AS (
      SELECT
        date_trunc('week', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') + interval '1 day' as week_start,
        DATE(ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as day,
        SUM(ct.value) as daily_sum
      FROM "CounterTimeseries" ct
      WHERE ct.date >= ${startDate}::date
        AND ct.date <= ${endDate}::date
      GROUP BY week_start, day
    )
    SELECT
      to_char(weeks.week_start, 'YYYY-MM-DD') as week,
      COALESCE(ROUND(AVG(daily_totals.daily_sum) FILTER (WHERE daily_totals.daily_sum > 50), 0), 0)::integer as value
    FROM weeks
    LEFT JOIN daily_totals ON daily_totals.week_start = weeks.week_start
    WHERE weeks.week_start <= ${endDate}::date
    GROUP BY weeks.week_start
    ORDER BY weeks.week_start ASC
  `;

  return {
    year: result,
  };
}

export async function getGlobalWeeklyStatsForYearComplete(year: string) {
  const selectedYear = parseInt(year);
  const startDate = `${selectedYear}-01-01`;
  const endDate = `${selectedYear}-12-31`;

  const result = await prisma.$queryRaw<{ week: string; value: number }[]>`
    WITH RECURSIVE weeks AS (
      SELECT date_trunc('week', ${startDate}::date) + interval '1 day' as week_start
      UNION ALL
      SELECT week_start + interval '1 week'
      FROM weeks
      WHERE week_start < ${endDate}::date
    ),
    daily_totals AS (
      SELECT
        date_trunc('week', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') + interval '1 day' as week_start,
        DATE(ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as day,
        SUM(ct.value) as daily_sum
      FROM "CounterTimeseries" ct
      WHERE ct.date >= ${startDate}::date
        AND ct.date <= ${endDate}::date
      GROUP BY week_start, day
    )
    SELECT
      to_char(weeks.week_start, 'YYYY-MM-DD') as week,
      COALESCE(ROUND(AVG(daily_totals.daily_sum) FILTER (WHERE daily_totals.daily_sum > 50), 0), 0)::integer as value
    FROM weeks
    LEFT JOIN daily_totals ON daily_totals.week_start = weeks.week_start
    WHERE weeks.week_start <= ${endDate}::date
    GROUP BY weeks.week_start
    ORDER BY weeks.week_start ASC
  `;

  return {
    year: result,
  };
}

export async function getGlobalWeeklyComparisonStats() {
  const parisNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })
  );
  const currentYear = parisNow.getFullYear();
  const previousYear = currentYear - 1;

  const [currentYearData, previousYearData] = await Promise.all([
    getGlobalWeeklyStatsForYear(currentYear.toString()),
    getGlobalWeeklyStatsForYearComplete(previousYear.toString()),
  ]);

  const formatWeeklyComparisonData = (
    data: { week: string; value: number }[],
    year: number
  ) => {
    return data.map((item) => ({
      week: item.week,
      value: item.value,
      year: year,
    }));
  };

  const currentYearFormatted = formatWeeklyComparisonData(
    currentYearData.year,
    currentYear
  );
  const previousYearFormatted = formatWeeklyComparisonData(
    previousYearData.year,
    previousYear
  );

  const currentWeekStart = new Date(parisNow);
  currentWeekStart.setDate(
    currentWeekStart.getDate() - currentWeekStart.getDay() + 1
  );
  currentWeekStart.setHours(0, 0, 0, 0);

  const filteredCurrentYear = currentYearFormatted.filter((item) => {
    const weekDate = new Date(item.week);
    return weekDate <= currentWeekStart;
  });

  const [currentYearDirectTotal, previousYearDirectTotal] = await Promise.all([
    prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COALESCE(SUM(CASE 
        WHEN "CounterTimeseries".date <= ${currentWeekStart}::timestamp 
        THEN value 
        ELSE 0 
      END), 0)::bigint as total
      FROM "CounterTimeseries"
      WHERE EXTRACT(YEAR FROM "CounterTimeseries".date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = ${currentYear}
    `,
    prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COALESCE(SUM(value), 0)::bigint as total
      FROM "CounterTimeseries"
      WHERE EXTRACT(YEAR FROM "CounterTimeseries".date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = ${previousYear}
    `,
  ]);

  return {
    currentYear: filteredCurrentYear,
    previousYear: previousYearFormatted,
    currentYearTotal: Number(currentYearDirectTotal[0].total),
    previousYearTotal: Number(previousYearDirectTotal[0].total),
  };
}
