import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getStartOfDay, getEndOfDay, toParisTime } from "./dateHelpers";
import { PreloadedCounterData } from "@/app/page";

export async function getHourlyStats(counterId: string) {
  const now = toParisTime(new Date());
  const today = getStartOfDay(now);

  // Calculer le début de la semaine (lundi)
  const startOfWeek = today;
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay() + 1);

  // Récupérer les statistiques pour chaque jour de la semaine
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  const stats = await Promise.all(
    days.map(async (day) => {
      const dayIndex = days.indexOf(day);
      const startDate = toParisTime(startOfWeek);
      startDate.setDate(today.getDate() + dayIndex);
      startDate.setHours(0, 0, 0, 0);

      const endDate = toParisTime(startDate);
      endDate.setHours(23, 59, 59, 999);

      const hourlyStats = await prisma.$queryRaw<
        { hour: number; total: number }[]
      >(
        Prisma.sql`
          WITH hourly_stats AS (
            SELECT 
              EXTRACT(HOUR FROM (date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'))::integer as hour,
              SUM(value)::integer as total
            FROM "CounterTimeseries"
            WHERE "counterId" = ${counterId}
              AND date >= ${startDate}::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'
              AND date < ${endDate}::timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'
            GROUP BY hour
          )
          SELECT 
            hour,
            COALESCE(total, 0) as total
          FROM generate_series(0, 23) as hours
          LEFT JOIN hourly_stats ON hourly_stats.hour = hours
          ORDER BY hour
        `
      );

      return {
        day,
        stats: hourlyStats.map((stat) => ({
          hour: stat.hour,
          value: stat.total,
        })),
      };
    })
  );

  return stats.reduce((acc, { day, stats }) => {
    acc[day as keyof PreloadedCounterData["hourlyStats"]] = stats;
    return acc;
  }, {} as PreloadedCounterData["hourlyStats"]);
}
