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
    isRaining: boolean;
    isCloudy: boolean;
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

  // Récupération des données météo pour aujourd'hui
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
      rain: true,
      weatherCode: true,
      cloudCover: true,
    },
  });

  // Récupération des données météo pour hier
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

  // Calcul des températures maximales
  const yesterdayMaxTemp = yesterdayWeather
    .map((w) => w.temperature2m)
    .filter((temp): temp is number => temp !== null)
    .reduce((max, temp) => Math.max(max, temp), -100);

  const todayMaxTemp = todayWeather
    .map((w) => w.temperature2m)
    .filter((temp): temp is number => temp !== null)
    .reduce((max, temp) => Math.max(max, temp), -100);

  // Vérification de la pluie pour aujourd'hui
  const isRaining = todayWeather.some(w => 
    w.rain && w.rain > 0 || 
    (w.weatherCode && [61, 63, 65, 80, 81, 82].includes(w.weatherCode))
  );

  // Vérification du ciel couvert pour aujourd'hui
  const isCloudy = todayWeather.some(w => 
    w.cloudCover && w.cloudCover > 80 || 
    (w.weatherCode && [1, 2, 3].includes(w.weatherCode))
  );

  return {
    passages: {
      dayBeforeYesterday: Number(dayBeforeYesterdayStats._sum?.value || 0),
      yesterday: Number(yesterdayStats._sum?.value || 0),
      today: Number(todayStats._sum?.value || 0),
    },
    weather: {
      yesterday: yesterdayMaxTemp === -100 ? null : yesterdayMaxTemp,
      today: todayMaxTemp === -100 ? null : todayMaxTemp,
      isRaining,
      isCloudy,
    },
  };
}
