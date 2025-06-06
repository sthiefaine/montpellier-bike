"use server";

import { prisma } from "@/lib/prisma";

export type Weather = {
  isRaining: boolean;
  isCloudy: boolean;
  temperature: number | null;
};

export type DailyStats = {
  passages: {
    dayBeforeYesterday: number;
    yesterday: number;
  };
  weather: {
    dayBeforeYesterday: Weather;
    yesterday: Weather;
    today: Weather;
  };
};

export async function getDailyStats(): Promise<DailyStats> {
  const timeZone = "Europe/Paris";
  const today = new Date(new Date().toLocaleString("en-US", { timeZone }));
  today.setHours(0, 0, 0, 0);

  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
  dayBeforeYesterday.setHours(1, 0, 0, 0);

  const dayBeforeYesterdayEnd = new Date(today);
  dayBeforeYesterdayEnd.setDate(dayBeforeYesterdayEnd.getDate() - 1);
  dayBeforeYesterdayEnd.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(1, 0, 0, 0);

  const yesterdayEnd = new Date(today);
  yesterdayEnd.setDate(yesterdayEnd.getDate());
  yesterdayEnd.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);


  // Statistiques des passages
  const [dayBeforeYesterdayStats, yesterdayStats] = await Promise.all([
    prisma.counterTimeseries.aggregate({
      where: {
        date: {
          gte: dayBeforeYesterday,
          lte: dayBeforeYesterdayEnd,
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
          lte: today,
        },
      },
      _sum: {
        value: true,
      },
    }),
  ]);

  // Récupération des données météo

  const todayWeather = await prisma.weatherTimeseries.findMany({
    where: {
      date: {
        gte: today,
        lte: tomorrow,
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

  const dayBeforeYesterdayWeather = await prisma.weatherTimeseries.findMany({
    where: {
      date: {
        gte: dayBeforeYesterday,
        lte: dayBeforeYesterdayEnd,
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

  const yesterdayWeather = await prisma.weatherTimeseries.findMany({
    where: {
      date: {
        gte: yesterday,
        lt: yesterdayEnd,
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

  const maxTemp = (weather: { temperature2m: number | null }[]) => {
    return weather
      .map((w) => w.temperature2m)
      .filter((temp): temp is number => temp !== null)
      .reduce((max, temp) => Math.max(max, temp), -100);
  };

  return {
    passages: {
      dayBeforeYesterday: Number(dayBeforeYesterdayStats._sum?.value || 0),
      yesterday: Number(yesterdayStats._sum?.value || 0),
    },
    weather: {
      dayBeforeYesterday: {
        temperature: maxTemp(dayBeforeYesterdayWeather),
        isRaining: dayBeforeYesterdayWeather.some(w => w.rain && w.rain > 0),
        isCloudy: dayBeforeYesterdayWeather.some(w => w.cloudCover && w.cloudCover > 80),
      },
      yesterday: {
        temperature: maxTemp(yesterdayWeather),
        isRaining: yesterdayWeather.some(w => w.rain && w.rain > 0),
        isCloudy: yesterdayWeather.some(w => w.cloudCover && w.cloudCover > 80),
      },
      today: {
        temperature: maxTemp(todayWeather),
        isRaining: todayWeather.some(w => w.rain && w.rain > 0),
        isCloudy: todayWeather.some(w => w.cloudCover && w.cloudCover > 80),
      },
    },
  };
}
