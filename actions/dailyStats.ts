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
  const tomorrow = getStartOfDay(new Date(today.getTime() + 24 * 60 * 60 * 1000));
  const dayBeforeYesterdayBounds = getBeforeYesterdayBoundsParis(now);
  const dayBeforeYesterday = dayBeforeYesterdayBounds.start;
  const dayBeforeYesterdayEnd = dayBeforeYesterdayBounds.end;
  const yesterdayBounds = getYesterdayBoundsParis(now);
  const yesterday = yesterdayBounds.start;
  const yesterdayEnd = yesterdayBounds.end;

  const [dayBeforeYesterdayStats, yesterdayStats] = await Promise.all([
    prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(value), 0)::integer as total
      FROM "CounterTimeseries"
      WHERE date_trunc('day', date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = date_trunc('day', ${dayBeforeYesterday} AT TIME ZONE 'Europe/Paris')
    `,
    prisma.$queryRaw<{ total: number }[]>`
      SELECT COALESCE(SUM(value), 0)::integer as total
      FROM "CounterTimeseries"
      WHERE date_trunc('day', date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris') = date_trunc('day', ${yesterday} AT TIME ZONE 'Europe/Paris')
    `,
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


  console.log("eeeee", todayWeather);

  return {
    passages: {
      dayBeforeYesterday: Number(dayBeforeYesterdayStats[0].total),
      yesterday: Number(yesterdayStats[0].total),
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
