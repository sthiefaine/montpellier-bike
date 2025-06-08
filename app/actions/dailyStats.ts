"use server";

import { prisma } from "@/lib/prisma";
import {
  getBeforeYesterdayBoundsParis,
  getEndOfDay,
  getStartOfDay,
  getYesterdayBoundsParis,
} from "./counters/dateHelpers";

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
  const now = new Date();
  const today = getStartOfDay(now);
  const tomorrow = getEndOfDay(now);
  const dayBeforeYesterdayBounds = getBeforeYesterdayBoundsParis(now);
  const dayBeforeYesterday = dayBeforeYesterdayBounds.start;
  const dayBeforeYesterdayEnd = dayBeforeYesterdayBounds.end;
  const yesterdayBounds = getYesterdayBoundsParis(now);
  const yesterday = yesterdayBounds.start;
  const yesterdayEnd = yesterdayBounds.end;

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
        lte: yesterdayEnd,
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
        isRaining: dayBeforeYesterdayWeather.some((w) => w.rain && w.rain > 0),
        isCloudy: dayBeforeYesterdayWeather.some(
          (w) => w.cloudCover && w.cloudCover > 80
        ),
      },
      yesterday: {
        temperature: maxTemp(yesterdayWeather),
        isRaining: yesterdayWeather.some((w) => w.rain && w.rain > 0),
        isCloudy: yesterdayWeather.some(
          (w) => w.cloudCover && w.cloudCover > 80
        ),
      },
      today: {
        temperature: maxTemp(todayWeather),
        isRaining: todayWeather.some((w) => w.rain && w.rain > 0),
        isCloudy: todayWeather.some((w) => w.cloudCover && w.cloudCover > 80),
      },
    },
  };
}
