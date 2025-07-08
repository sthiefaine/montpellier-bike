"use server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  DailyDataPoint,
  CounterGlobalDailyStats,
} from "@/types/counters/counters";
import { WEEK_DAYS_CONFIG } from "@/helpers";

export async function getDailyStatsForYear(counterId: string) {
  const now = new Date();
  const currentYear = now.getFullYear();

  const startOfYear = `${currentYear}-01-01`;
  const endOfYear = `${currentYear}-12-31`;

  const dailyStats = await prisma.$queryRaw<{ day: string; total: number }[]>(
    Prisma.sql`
      WITH dates AS (
        SELECT generate_series(
          ${startOfYear}::date,
          ${endOfYear}::date,
          interval '1 day'
        )::date as day
      ),
      daily_stats AS (
        SELECT 
          dates.day as day,
          COALESCE(SUM(value), 0)::integer as total
        FROM dates
        LEFT JOIN "CounterTimeseries" ON 
          "CounterTimeseries"."counterId" = ${counterId}
          AND date_trunc('day', "CounterTimeseries".date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = dates.day
        GROUP BY dates.day
      )
      SELECT day::text as day, total
      FROM daily_stats
      WHERE day < (NOW() AT TIME ZONE 'Europe/Paris')::date
      ORDER BY day
    `
  );

  const filteredStats = dailyStats.map((stat) => ({
    day: stat.day,
    value: stat.total,
  }));

  const total = filteredStats.reduce((acc, stat) => acc + stat.value, 0);
  const activeDays = filteredStats.filter((stat) => stat.value > 0).length;
  const globalAverage = total / filteredStats.length;
  const activeDaysAverage = activeDays > 0 ? total / activeDays : 0;

  return {
    year: filteredStats,
    globalAverage,
    activeDaysAverage,
  };
}

export async function getGlobalDailyStatsForYear(
  year?: string
): Promise<CounterGlobalDailyStats> {
  const now = new Date();
  const selectedYear = year ? parseInt(year) : now.getFullYear();
  const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const startDate = `${selectedYear}-01-01`;
  const endDate = `${selectedYear}-12-31`;

  const result = await prisma.$queryRaw<DailyDataPoint[]>(
    Prisma.sql`
      WITH dates AS (
        SELECT generate_series(
          ${startDate}::date,
          ${endDate}::date,
          interval '1 day'
        )::date as date
      )
      SELECT 
        dates.date::text as day,
        COALESCE(SUM(ct.value), 0)::integer as value
      FROM dates
      LEFT JOIN "CounterTimeseries" ct ON 
        date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = dates.date
      WHERE dates.date <= ${today}::date
      GROUP BY dates.date
      ORDER BY dates.date ASC
    `
  );

  const filteredResult = filterConsecutiveZeros(result, 2);

  const activeDaysData = filteredResult.filter(item => item.value > 0);

  const dailyTotals = activeDaysData.reduce((acc, curr) => {
    const date = new Date(curr.day);
    const dayOfWeek = date.getDay();
    const dayName = dayNames[dayOfWeek];

    if (!acc[dayName]) {
      acc[dayName] = { total: 0, count: 0 };
    }

    acc[dayName].total += curr.value;
    acc[dayName].count += 1;

    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const formattedTotals = Object.entries(dailyTotals).map(([day, data]) => ({
    day,
    value: data.total,
    count: data.count,
  }));

  formattedTotals.sort(
    (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  );

  // Calculer la moyenne des totaux quotidiens
  const totalValue = formattedTotals.reduce((sum, curr) => sum + curr.value, 0);
  const globalAverage = Math.round(totalValue / formattedTotals.length);

  return {
    dailyTotals: formattedTotals,
    globalAverage,
    totalDays: filteredResult.length,
    originalDays: result.length,
    filteredDays: result.length - filteredResult.length,
  };
}

export async function getGlobalDailyStatsForPeriod(
  startDate: string,
  endDate: string
): Promise<CounterGlobalDailyStats> {
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const result = await prisma.$queryRaw<DailyDataPoint[]>(
    Prisma.sql`
      WITH dates AS (
        SELECT generate_series(
          ${startDate}::date,
          ${endDate}::date,
          interval '1 day'
        )::date as date
      )
      SELECT 
        dates.date::text as day,
        COALESCE(SUM(ct.value), 0)::integer as value
      FROM dates
      LEFT JOIN "CounterTimeseries" ct ON 
        date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = dates.date
      GROUP BY dates.date
      ORDER BY dates.date ASC
    `
  );

  const filteredResult = filterConsecutiveZeros(result, 2);

  // Filtrer les jours avec 0 passages pour les totaux par jour de la semaine
  const activeDaysData = filteredResult.filter(item => item.value > 0);

  const dailyTotals = activeDaysData.reduce((acc, curr) => {
    const date = new Date(curr.day);
    const dayOfWeek = date.getDay();
    const dayName = dayNames[dayOfWeek];

    if (!acc[dayName]) {
      acc[dayName] = { total: 0, count: 0 };
    }

    acc[dayName].total += curr.value;
    acc[dayName].count += 1;

    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const formattedTotals = Object.entries(dailyTotals).map(([day, data]) => ({
    day,
    value: data.total,
    count: data.count,
  }));

  formattedTotals.sort(
    (a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  );

  // Calculer la moyenne des totaux quotidiens
  const totalValue = formattedTotals.reduce((sum, curr) => sum + curr.value, 0);
  const globalAverage = Math.round(totalValue / formattedTotals.length);

  return {
    dailyTotals: formattedTotals,
    globalAverage,
    totalDays: filteredResult.length,
    originalDays: result.length,
    filteredDays: result.length - filteredResult.length,
  };
}

// Fonction pour filtrer les périodes de plus de N jours consécutifs à zéro
function filterConsecutiveZeros(
  data: DailyDataPoint[],
  maxConsecutiveZeros: number
): DailyDataPoint[] {
  const result = [];
  let consecutiveZeros = 0;
  let zeroStreak = [];

  for (let i = 0; i < data.length; i++) {
    const current = data[i];

    if (current.value === 0) {
      consecutiveZeros++;
      zeroStreak.push(i);
    } else {
      if (consecutiveZeros > maxConsecutiveZeros) {
        // Ne pas ajouter les jours de la série problématique
      } else {
        for (const idx of zeroStreak) {
          result.push(data[idx]);
        }
      }

      consecutiveZeros = 0;
      zeroStreak = [];
      result.push(current);
    }
  }

  // Traiter la dernière série si elle se termine par des zéros
  if (consecutiveZeros > 0) {
    if (consecutiveZeros <= maxConsecutiveZeros) {
      for (const idx of zeroStreak) {
        result.push(data[idx]);
      }
    } else {
      console.log(
        `Période problématique détectée en fin: ${consecutiveZeros} jours consécutifs à zéro du ${
          data[zeroStreak[0]].day
        } au ${data[zeroStreak[zeroStreak.length - 1]].day}`
      );
    }
  }

  return result;
}

export async function getGlobalFrequentationStats(
  startDate: string,
  endDate: string,
  aggregation: "week" | "month" = "week",
  includePreviousYear: boolean = true
) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculer la période de l'année précédente
  const previousYearStart = new Date(start);
  previousYearStart.setFullYear(previousYearStart.getFullYear() - 1);
  const previousYearEnd = new Date(end);
  previousYearEnd.setFullYear(previousYearEnd.getFullYear() - 1);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // Requête simplifiée pour l'année courante
  const currentYearQuery = `
    SELECT 
      ${
        aggregation === "week"
          ? "to_char(date_trunc('week', date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')), 'YYYY-MM-DD')"
          : "to_char(date_trunc('month', date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')), 'YYYY-MM')"
      } as period,
      AVG(daily_sum) as value
    FROM (
      SELECT 
        date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as day,
        SUM(ct.value) as daily_sum
      FROM "CounterTimeseries" ct
      WHERE ct.date >= ${formatDate(start)}::date
        AND ct.date <= ${formatDate(end)}::date
      GROUP BY day
    ) daily_totals
    CROSS JOIN "CounterTimeseries" ct
    WHERE date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = daily_totals.day
    GROUP BY ${
      aggregation === "week"
        ? "date_trunc('week', date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))"
        : "date_trunc('month', date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))"
    }
    ORDER BY period
  `;

  // Requête simplifiée pour l'année précédente
  const previousYearQuery = `
    SELECT 
      ${
        aggregation === "week"
          ? "to_char(date_trunc('week', date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')), 'YYYY-MM-DD')"
          : "to_char(date_trunc('month', date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')), 'YYYY-MM')"
      } as period,
      AVG(daily_sum) as value
    FROM (
      SELECT 
        date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as day,
        SUM(ct.value) as daily_sum
      FROM "CounterTimeseries" ct
      WHERE ct.date >= ${formatDate(previousYearStart)}::date
        AND ct.date <= ${formatDate(previousYearEnd)}::date
      GROUP BY day
    ) daily_totals
    CROSS JOIN "CounterTimeseries" ct
    WHERE date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = daily_totals.day
    GROUP BY ${
      aggregation === "week"
        ? "date_trunc('week', date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))"
        : "date_trunc('month', date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))"
    }
    ORDER BY period
  `;

  try {
    const [currentYearData, previousYearData] = await Promise.all([
      prisma.$queryRaw<{ period: string; value: number }[]>(
        Prisma.raw(currentYearQuery)
      ),
      includePreviousYear
        ? prisma.$queryRaw<{ period: string; value: number }[]>(
            Prisma.raw(previousYearQuery)
          )
        : Promise.resolve([]),
    ]);

    return {
      currentYear: currentYearData,
      previousYear: previousYearData,
      aggregation,
      startDate: formatDate(start),
      endDate: formatDate(end),
      previousYearStartDate: formatDate(previousYearStart),
      previousYearEndDate: formatDate(previousYearEnd),
    };
  } catch (error) {
    console.error("Erreur dans getGlobalFrequentationStats:", error);
    return {
      currentYear: [],
      previousYear: [],
      aggregation,
      startDate: formatDate(start),
      endDate: formatDate(end),
      previousYearStartDate: formatDate(previousYearStart),
      previousYearEndDate: formatDate(previousYearEnd),
    };
  }
}

export async function getGlobalEvolutionStats() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const previousYear = currentYear - 1;

  // Date actuelle de l'année précédente
  const previousYearSameDate = new Date(now);
  previousYearSameDate.setFullYear(previousYear);

  const formatDate = (date: Date) => date.toISOString().split("T")[0];
  const currentDate = formatDate(now);
  const previousYearDate = formatDate(previousYearSameDate);

  // Requête pour l'année actuelle
  const currentYearQuery = `
    SELECT 
      to_char(date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'), 'YYYY-MM-DD') as day,
      SUM(ct.value)::integer as total,
      AVG(daily_sum)::integer as average
    FROM (
      SELECT 
        date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as day,
        SUM(ct.value) as daily_sum
      FROM "CounterTimeseries" ct
      WHERE ct.date >= '${currentYear}-01-01'::date
        AND ct.date <= '${currentDate}'::date
      GROUP BY day
    ) daily_totals
    CROSS JOIN "CounterTimeseries" ct
    WHERE date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = daily_totals.day
    GROUP BY date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')
    ORDER BY day
  `;

  // Requête pour l'année précédente
  const previousYearQuery = `
    SELECT 
      to_char(date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'), 'YYYY-MM-DD') as day,
      SUM(ct.value)::integer as total,
      AVG(daily_sum)::integer as average
    FROM (
      SELECT 
        date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as day,
        SUM(ct.value) as daily_sum
      FROM "CounterTimeseries" ct
      WHERE ct.date >= '${previousYear}-01-01'::date
        AND ct.date <= '${previousYearDate}'::date
      GROUP BY day
    ) daily_totals
    CROSS JOIN "CounterTimeseries" ct
    WHERE date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = daily_totals.day
    GROUP BY date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')
    ORDER BY day
  `;

  try {
    const [currentYearData, previousYearData] = await Promise.all([
      prisma.$queryRaw<{ day: string; total: number; average: number }[]>(
        Prisma.raw(currentYearQuery)
      ),
      prisma.$queryRaw<{ day: string; total: number; average: number }[]>(
        Prisma.raw(previousYearQuery)
      ),
    ]);

    return {
      currentYear: currentYearData,
      previousYear: previousYearData,
      currentYearDate: currentDate,
      previousYearDate: previousYearDate,
    };
  } catch (error) {
    console.error("Erreur dans getGlobalEvolutionStats:", error);
    return {
      currentYear: [],
      previousYear: [],
      currentYearDate: currentDate,
      previousYearDate: previousYearDate,
    };
  }
}

export async function getGlobalEvolutionStatsForPeriods(
  period1Start: string,
  period1End: string,
  period2Start: string,
  period2End: string
) {
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  // Requête pour la première période
  const period1Query = `
    SELECT 
      to_char(date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'), 'YYYY-MM-DD') as day,
      SUM(ct.value)::integer as total,
      AVG(daily_sum)::integer as average
    FROM (
      SELECT 
        date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as day,
        SUM(ct.value) as daily_sum
      FROM "CounterTimeseries" ct
      WHERE ct.date >= '${period1Start}'::date
        AND ct.date <= '${period1End}'::date
      GROUP BY day
    ) daily_totals
    CROSS JOIN "CounterTimeseries" ct
    WHERE date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = daily_totals.day
    GROUP BY date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')
    ORDER BY day
  `;

  // Requête pour la deuxième période
  const period2Query = `
    SELECT 
      to_char(date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'), 'YYYY-MM-DD') as day,
      SUM(ct.value)::integer as total,
      AVG(daily_sum)::integer as average
    FROM (
      SELECT 
        date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as day,
        SUM(ct.value) as daily_sum
      FROM "CounterTimeseries" ct
      WHERE ct.date >= '${period2Start}'::date
        AND ct.date <= '${period2End}'::date
      GROUP BY day
    ) daily_totals
    CROSS JOIN "CounterTimeseries" ct
    WHERE date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = daily_totals.day
    GROUP BY date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')
    ORDER BY day
  `;

  try {
    const [period1Data, period2Data] = await Promise.all([
      prisma.$queryRaw<{ day: string; total: number; average: number }[]>(
        Prisma.raw(period1Query)
      ),
      prisma.$queryRaw<{ day: string; total: number; average: number }[]>(
        Prisma.raw(period2Query)
      ),
    ]);

    return {
      currentYear: period1Data,
      previousYear: period2Data,
      currentYearDate: period1End,
      previousYearDate: period2End,
    };
  } catch (error) {
    console.error("Erreur dans getGlobalEvolutionStatsForPeriods:", error);
    return {
      currentYear: [],
      previousYear: [],
      currentYearDate: period1End,
      previousYearDate: period2End,
    };
  }
}

export async function getWeekendVsWeekdayStats(
  startDate: string,
  endDate: string
) {
  const formatDate = (date: Date) => date.toISOString().split("T")[0];

  const query = `
    SELECT 
      to_char(date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'), 'YYYY-MM-DD') as day,
      EXTRACT(DOW FROM date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')) as day_of_week,
      SUM(ct.value)::integer as total
    FROM "CounterTimeseries" ct
    WHERE ct.date >= '${startDate}'::date
      AND ct.date <= '${endDate}'::date
    GROUP BY date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')
    ORDER BY day
  `;

  try {
    const data = await prisma.$queryRaw<
      { day: string; day_of_week: number; total: number }[]
    >(Prisma.raw(query));

    // Séparer les données en semaine (0-4) et week-end (5-6)
    const weekdays = data.filter(
      (item) => item.day_of_week >= 1 && item.day_of_week <= 5
    );
    const weekends = data.filter(
      (item) => item.day_of_week === 0 || item.day_of_week === 6
    );

    // Calculer les moyennes
    const weekdayAverage =
      weekdays.length > 0
        ? Math.round(
            weekdays.reduce((sum, item) => sum + item.total, 0) /
              weekdays.length
          )
        : 0;

    const weekendAverage =
      weekends.length > 0
        ? Math.round(
            weekends.reduce((sum, item) => sum + item.total, 0) /
              weekends.length
          )
        : 0;

    // Calculer les totaux
    const weekdayTotal = weekdays.reduce((sum, item) => sum + item.total, 0);
    const weekendTotal = weekends.reduce((sum, item) => sum + item.total, 0);

    return {
      weekdays: {
        total: weekdayTotal,
        average: weekdayAverage,
        count: weekdays.length,
      },
      weekends: {
        total: weekendTotal,
        average: weekendAverage,
        count: weekends.length,
      },
      period: {
        start: startDate,
        end: endDate,
      },
    };
  } catch (error) {
    console.error("Erreur dans getWeekendVsWeekdayStats:", error);
    return {
      weekdays: { total: 0, average: 0, count: 0 },
      weekends: { total: 0, average: 0, count: 0 },
      period: { start: startDate, end: endDate },
    };
  }
}

export async function getDailyDistributionStats(
  startDate: string,
  endDate: string
) {
  try {
    const query = `
      WITH dates AS (
        SELECT generate_series(
          '${startDate}'::date,
          '${endDate}'::date,
          interval '1 day'
        )::date as date
      )
      SELECT 
        dates.date::text as day,
        COALESCE(SUM(ct.value), 0)::integer as total
      FROM dates
      LEFT JOIN "CounterTimeseries" ct ON 
        date_trunc('day', ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = dates.date
      GROUP BY dates.date
      ORDER BY dates.date
    `;

    const dailyData = await prisma.$queryRaw<{ day: string; total: number }[]>(
      Prisma.raw(query)
    );

    if (!dailyData || dailyData.length === 0) {
      return {
        distribution: [],
        period: { start: startDate, end: endDate },
      };
    }

    // Filtrer les jours avec 0 passages
    const activeDaysData = dailyData.filter(item => item.total > 0);

    const dayStats: { [key: number]: { total: number; count: number } } = {};

    // Ne traiter que les jours avec des passages > 0
    activeDaysData.forEach((item) => {
      const date = new Date(item.day);
      const dayOfWeek = date.getDay();

      if (!dayStats[dayOfWeek]) {
        dayStats[dayOfWeek] = { total: 0, count: 0 };
      }

      dayStats[dayOfWeek].total += item.total;
      dayStats[dayOfWeek].count += 1;
    });

    const weekDaysOrder = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const dayMapping = [6, 0, 1, 2, 3, 4, 5];

    const distribution = Object.entries(dayStats).map(
      ([dayOfWeekStr, stats]) => {
        const dayOfWeek = parseInt(dayOfWeekStr);
        const mappedIndex = dayMapping[dayOfWeek];
        const weekDayKey = weekDaysOrder[mappedIndex];
        const weekDayConfig =
          WEEK_DAYS_CONFIG[weekDayKey as keyof typeof WEEK_DAYS_CONFIG];

        return {
          name: weekDayConfig.name,
          total: stats.total,
          average: Math.round(stats.total / stats.count),
          count: stats.count,
          color: weekDayConfig.color,
          dayOfWeek: mappedIndex,
        };
      }
    );

    distribution.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

    return {
      distribution,
      period: {
        start: startDate,
        end: endDate,
      },
    };
  } catch (error) {
    console.error("Erreur dans getDailyDistributionStats:", error);
    return {
      distribution: [],
      period: { start: startDate, end: endDate },
    };
  }
}

export async function getAvailableYears() {
  try {
    const query = `
      SELECT DISTINCT 
        EXTRACT(YEAR FROM ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as year,
        COUNT(*) as record_count
      FROM "CounterTimeseries" ct
      GROUP BY EXTRACT(YEAR FROM ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')
      ORDER BY year DESC
    `;

    const years = await prisma.$queryRaw<{ year: any; record_count: any }[]>(
      Prisma.raw(query)
    );
    console.log("Années disponibles avec données:", years);

    // Convertir les Decimal en nombres
    const convertedYears = years.map((year) => ({
      year: Number(year.year),
      record_count: Number(year.record_count),
    }));

    return convertedYears;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des années disponibles:",
      error
    );
    return [];
  }
}

export async function getHourlyDistributionStats(
  startDate: string,
  endDate: string
) {
  try {
    console.log("getHourlyDistributionStats appelé avec:", {
      startDate,
      endDate,
    });

    // Requête SQL corrigée pour compter les jours distincts et filtrer les heures avec 0 passages
    const query = `
      WITH hours AS (
        SELECT generate_series(0, 23) as hour
      ),
      daily_hourly_totals AS (
        SELECT 
          EXTRACT(HOUR FROM (ct.date AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris') as hour,
          SUM(ct.value)::integer as total,
          COUNT(DISTINCT DATE(ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')) as day_count,
          ROUND(AVG(ct.value))::integer as average
        FROM "CounterTimeseries" ct
        WHERE DATE(ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') >= '${startDate}'::date
          AND DATE(ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') <= '${endDate}'::date
        GROUP BY 
          EXTRACT(HOUR FROM (ct.date AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris')
      )
      SELECT 
        h.hour,
        COALESCE(dht.total, 0)::integer as total,
        COALESCE(dht.day_count, 0) as day_count,
        COALESCE(dht.average, 0)::integer as average
      FROM hours h
      LEFT JOIN daily_hourly_totals dht ON h.hour = dht.hour
      WHERE COALESCE(dht.total, 0) > 0
      ORDER BY h.hour
    `;

    console.log("Exécution de la requête horaire:", query);
    const hourlyData = await prisma.$queryRaw<
      { hour: any; total: any; day_count: any; average: any }[]
    >(Prisma.raw(query));
    console.log("Résultats de la requête horaire:", hourlyData);

    if (!hourlyData || hourlyData.length === 0) {
      console.log("Aucune donnée horaire trouvée");
      return {
        distribution: [],
        period: { start: startDate, end: endDate },
      };
    }

    const distribution = hourlyData.map((item) => ({
      name: `${item.hour}h`,
      hour: Number(item.hour),
      total: Number(item.total),
      average: Math.round(Number(item.total) / Number(item.day_count)),
      count: Number(item.day_count),
    }));

    console.log("Distribution finale:", distribution);

    return {
      distribution,
      period: {
        start: startDate,
        end: endDate,
      },
    };
  } catch (error) {
    console.error("Erreur dans getHourlyDistributionStats:", error);
    return {
      distribution: [],
      period: { start: startDate, end: endDate },
    };
  }
}

export async function getGlobalAndByDayHourlyStats(
  startDate: string,
  endDate: string
) {
  try {
    // 1. Fréquentation horaire globale (tous jours confondus)
    const globalQuery = `
      WITH hours AS (
        SELECT generate_series(0, 23) as hour
      ),
      daily_hourly_totals AS (
        SELECT 
          EXTRACT(HOUR FROM (ct.date AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris') as hour,
          SUM(ct.value)::integer as total,
          COUNT(*) as day_count,
          ROUND(AVG(ct.value))::integer as average
        FROM "CounterTimeseries" ct
        WHERE DATE(ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') >= '${startDate}'::date
          AND DATE(ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') <= '${endDate}'::date
        GROUP BY 
          EXTRACT(HOUR FROM (ct.date AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris')
      )
      SELECT 
        h.hour,
        COALESCE(dht.total, 0)::integer as total,
        COALESCE(dht.day_count, 0) as day_count,
        COALESCE(dht.average, 0)::integer as average
      FROM hours h
      LEFT JOIN daily_hourly_totals dht ON h.hour = dht.hour
      ORDER BY h.hour
    `;
    const global = await prisma.$queryRaw<
      { hour: number; total: number; day_count: number; average: number }[]
    >(Prisma.raw(globalQuery));

    // 2. Fréquentation horaire par jour de la semaine
    const byDayQuery = `
      WITH daily_hourly_byday AS (
        SELECT 
          EXTRACT(DOW FROM (ct.date AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris') as dow,
          EXTRACT(HOUR FROM (ct.date AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris') as hour,
          SUM(ct.value)::integer as total,
          COUNT(*) as day_count,
          ROUND(AVG(ct.value))::integer as average
        FROM "CounterTimeseries" ct
        WHERE DATE(ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') >= '${startDate}'::date
          AND DATE(ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') <= '${endDate}'::date
        GROUP BY 
          EXTRACT(DOW FROM (ct.date AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris'),
          EXTRACT(HOUR FROM (ct.date AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris')
      )
      SELECT 
        dow,
        hour,
        total,
        day_count,
        average
      FROM daily_hourly_byday
      ORDER BY dow, hour
    `;
    const byDayRaw = await prisma.$queryRaw<
      {
        dow: number;
        hour: number;
        total: number;
        day_count: number;
        average: number;
      }[]
    >(Prisma.raw(byDayQuery));

    // On structure le résultat par jour de la semaine
    const byDay: Record<string, any[]> = {};
    for (let i = 0; i <= 6; i++) byDay[i] = [];
    byDayRaw.forEach((item) => {
      byDay[item.dow].push({
        hour: item.hour,
        total: item.total,
        average: item.average,
        count: item.day_count,
      });
    });

    return {
      global: global.map((item) => ({
        hour: item.hour,
        total: item.total,
        average: item.average,
        count: item.day_count,
      })),
      byDay,
    };
  } catch (error) {
    console.error("Erreur dans getGlobalAndByDayHourlyStats:", error);
    return {
      global: [],
      byDay: {},
    };
  }
}

export async function getHourlyStatsByDayOfWeek(
  startDate: string,
  endDate: string
) {
  try {
    console.log("getHourlyStatsByDayOfWeek appelé avec:", {
      startDate,
      endDate,
    });

    // D'abord, vérifions s'il y a des données dans la période
    const countQuery = await prisma.$queryRaw<[{ count: bigint }]>(Prisma.sql`
      SELECT COUNT(*) as count
      FROM "CounterTimeseries"
      WHERE date >= ${startDate}::date
        AND date <= ${endDate}::date
    `);

    console.log(
      "Nombre total d'enregistrements dans la période:",
      countQuery[0].count
    );

    if (Number(countQuery[0].count) === 0) {
      console.log("Aucune donnée trouvée pour la période");
      return [];
    }

    // Requête avec conversion explicite des BigInt en nombres
    const result = await prisma.$queryRaw<
      {
        day_of_week: number;
        day_name: string;
        hour_of_day: number;
        number_of_observations: bigint;
        total_passages: bigint;
        average_passages: number;
        min_passages: number;
        max_passages: number;
        standard_deviation: number;
      }[]
    >(Prisma.sql`
      SELECT 
        EXTRACT(DOW FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as day_of_week,
        CASE EXTRACT(DOW FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')
            WHEN 0 THEN 'Dimanche'
            WHEN 1 THEN 'Lundi'
            WHEN 2 THEN 'Mardi'
            WHEN 3 THEN 'Mercredi'
            WHEN 4 THEN 'Jeudi'
            WHEN 5 THEN 'Vendredi'
            WHEN 6 THEN 'Samedi'
        END as day_name,
        EXTRACT(HOUR FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') as hour_of_day,
        COUNT(*) as number_of_observations,
        SUM(value) as total_passages,
        AVG(value) as average_passages,
        MIN(value) as min_passages,
        MAX(value) as max_passages,
        ROUND(STDDEV(value), 2) as standard_deviation
      FROM "CounterTimeseries"
      WHERE date >= ${startDate}::date
        AND date <= ${endDate}::date
      GROUP BY 
        EXTRACT(DOW FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'), 
        EXTRACT(HOUR FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')
      ORDER BY 
        day_of_week, 
        hour_of_day
    `);

    // Convertir les BigInt en nombres normaux
    const convertedResult = result.map((row) => ({
      ...row,
      number_of_observations: Number(row.number_of_observations),
      total_passages: Number(row.total_passages),
    }));

    console.log("Résultat brut getHourlyStatsByDayOfWeek:", convertedResult);
    console.log("Nombre de lignes retournées:", convertedResult.length);

    return convertedResult;
  } catch (error) {
    console.error("Erreur dans getHourlyStatsByDayOfWeek:", error);
    return [];
  }
}

export async function getHourlyDistributionStatsWithFilter(
  startDate: string,
  endDate: string,
  filter: "global" | "week" | "weekend"
) {
  try {
    console.log("getHourlyDistributionStatsWithFilter appelé avec:", {
      startDate,
      endDate,
      filter,
    });

    let dayFilter = "";
    if (filter === "week") {
      dayFilter =
        "AND EXTRACT(DOW FROM (ct.date AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris') BETWEEN 1 AND 5";
    } else if (filter === "weekend") {
      dayFilter =
        "AND EXTRACT(DOW FROM (ct.date AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris') IN (0, 6)";
    }

    const query = `
      WITH hours AS (
        SELECT generate_series(0, 23) as hour
      ),
      daily_hourly_totals AS (
        SELECT 
          EXTRACT(HOUR FROM (ct.date AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris') as hour,
          SUM(ct.value)::integer as total,
          COUNT(DISTINCT DATE(ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')) as day_count,
          ROUND(AVG(ct.value))::integer as average
        FROM "CounterTimeseries" ct
        WHERE DATE(ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') >= '${startDate}'::date
          AND DATE(ct.date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') <= '${endDate}'::date
          ${dayFilter}
        GROUP BY 
          EXTRACT(HOUR FROM (ct.date AT TIME ZONE 'UTC') AT TIME ZONE 'Europe/Paris')
      )
      SELECT 
        h.hour,
        COALESCE(dht.total, 0)::integer as total,
        COALESCE(dht.day_count, 0) as day_count,
        COALESCE(dht.average, 0)::integer as average
      FROM hours h
      LEFT JOIN daily_hourly_totals dht ON h.hour = dht.hour
      WHERE COALESCE(dht.total, 0) > 0
      ORDER BY h.hour
    `;

    console.log("Exécution de la requête horaire avec filtre:", query);
    const hourlyData = await prisma.$queryRaw<
      { hour: any; total: any; day_count: any; average: any }[]
    >(Prisma.raw(query));
    console.log("Résultats de la requête horaire avec filtre:", hourlyData);

    if (!hourlyData || hourlyData.length === 0) {
      console.log("Aucune donnée horaire trouvée avec le filtre");
      return {
        distribution: [],
        period: { start: startDate, end: endDate },
      };
    }

    const distribution = hourlyData.map((item) => ({
      name: `${item.hour}h`,
      hour: Number(item.hour),
      total: Number(item.total),
      average: Math.round(Number(item.total) / Number(item.day_count)),
      count: Number(item.day_count),
    }));

    console.log("Distribution finale avec filtre:", distribution);

    return {
      distribution,
      period: {
        start: startDate,
        end: endDate,
      },
    };
  } catch (error) {
    console.error("Erreur dans getHourlyDistributionStatsWithFilter:", error);
    return {
      distribution: [],
      period: { start: startDate, end: endDate },
    };
  }
}
