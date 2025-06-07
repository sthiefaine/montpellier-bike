import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getStartOfWeek, getEndOfWeek, getStartOfDay } from "./dateHelpers";

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
