"use server";

import { prisma } from "@/lib/prisma";

export type DailyStats = {
  passages: {
    yesterday: number;
    today: number;
  };
  weather: {
    yesterday: number | null;
    today: number | null;
  };
};

export async function getDailyStats(): Promise<DailyStats> {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Statistiques des passages
  const yesterdayStats = await prisma.counterTimeseries.aggregate({
    where: {
      date: {
        gte: yesterday,
        lt: today,
      },
    },
    _sum: {
      value: true,
    },
  });

  const todayStats = await prisma.counterTimeseries.aggregate({
    where: {
      date: {
        gte: today,
      },
    },
    _sum: {
      value: true,
    },
  });

  // Récupération des températures
  const weatherData = await prisma.weatherTimeseries.findMany({
    where: {
      date: {
        gte: yesterday,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
      type: "hourly",
    },
    select: {
      date: true,
      temperature2m: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  // Calcul des températures max par jour
  const maxTemps = weatherData.reduce((acc, curr) => {
    const date = new Date(curr.date);
    date.setHours(0, 0, 0, 0);
    const dateStr = date.toISOString();

    if (
      !acc[dateStr] ||
      (curr.temperature2m && curr.temperature2m > acc[dateStr])
    ) {
      acc[dateStr] = curr.temperature2m;
    }
    return acc;
  }, {} as Record<string, number | null>);

  return {
    passages: {
      yesterday: yesterdayStats._sum.value || 0,
      today: todayStats._sum.value || 0,
    },
    weather: {
      yesterday: maxTemps[yesterday.toISOString()] || null,
      today: maxTemps[today.toISOString()] || null,
    },
  };
}
