"use server";

import { prisma } from "@/lib/prisma";

export type DailyStats = {
  passages: {
    dayBeforeYesterday: number;
    yesterday: number;
    today: number;
  };
  weather: {
    yesterday: number | null;
    today: number | null;
  };
};

export async function getDailyStats(): Promise<DailyStats> {
  const timeZone = "Europe/Paris";
  const today = new Date(new Date().toLocaleString("en-US", { timeZone }));
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Statistiques des passages
  const [dayBeforeYesterdayStats, yesterdayStats, todayStats] = await Promise.all([
    prisma.counterTimeseries.aggregate({
      where: {
        date: {
          gte: dayBeforeYesterday,
          lt: yesterday,
        },
      },
      _sum: {
        value: true,
      },
    }),
    prisma.counterTimeseries.aggregate({
      where: {
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
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        value: true,
      },
    }),
  ]);

  // Récupération des températures pour hier
  const yesterdayWeather = await prisma.weatherTimeseries.findMany({
    where: {
      date: {
        gte: yesterday,
        lt: today,
      },
      type: "hourly",
    },
    select: {
      temperature2m: true,
    },
  });

  // Récupération des températures pour aujourd'hui
  const todayWeather = await prisma.weatherTimeseries.findMany({
    where: {
      date: {
        gte: today,
        lt: tomorrow,
      },
      type: "hourly",
    },
    select: {
      temperature2m: true,
    },
  });

  // Calcul des températures maximales
  const yesterdayMaxTemp = yesterdayWeather
    .map((w) => w.temperature2m)
    .filter((temp): temp is number => temp !== null)
    .reduce((max, temp) => Math.max(max, temp), -100);

  const todayMaxTemp = todayWeather
    .map((w) => w.temperature2m)
    .filter((temp): temp is number => temp !== null)
    .reduce((max, temp) => Math.max(max, temp), -100);

  return {
    passages: {
      dayBeforeYesterday: Number(dayBeforeYesterdayStats._sum?.value || 0),
      yesterday: Number(yesterdayStats._sum?.value || 0),
      today: Number(todayStats._sum?.value || 0),
    },
    weather: {
      yesterday: yesterdayMaxTemp === -100 ? null : yesterdayMaxTemp,
      today: todayMaxTemp === -100 ? null : todayMaxTemp,
    },
  };
}
