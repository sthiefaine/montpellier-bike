import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function getHourlyStats(counterId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const startOfWeek = new Date(today);
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  startOfWeek.setDate(today.getDate() - diff);

  const dayPromises = Array.from({ length: 7 }, (_, index) => {
    const dayStart = new Date(startOfWeek);
    dayStart.setDate(dayStart.getDate() + index);
    dayStart.setHours(1, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    dayEnd.setHours(0, 0, 0, 0);

    const currentHour = now.getHours();
    const isCurrentDay = index === (dayOfWeek === 0 ? 6 : dayOfWeek - 1);

    return prisma.$queryRaw<{ hour: number; total: bigint }[]>(
      Prisma.sql`
        SELECT 
          EXTRACT(HOUR FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris')::integer as hour,
          COALESCE(SUM(value), 0)::bigint as total
        FROM "CounterTimeseries"
        WHERE "counterId" = ${counterId}
          AND date >= ${dayStart}
          AND date <= ${dayEnd}
          AND (
            NOT ${isCurrentDay}::boolean 
            OR EXTRACT(HOUR FROM date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') <= ${currentHour}
          )
        GROUP BY hour
        ORDER BY hour ASC
      `
    );
  });

  const [
    mondayStats,
    tuesdayStats,
    wednesdayStats,
    thursdayStats,
    fridayStats,
    saturdayStats,
    sundayStats,
  ] = await Promise.all(dayPromises);

  const formatHourlyData = (stats: { hour: number; total: bigint }[]) => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
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
