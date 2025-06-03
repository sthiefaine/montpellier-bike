'use server';
import { prisma } from '@/lib/prisma';
import { BikeCounter } from '@prisma/client';
import { defaultCenters } from '@/lib/defaultCenters';

export async function getCounters(): Promise<BikeCounter[]> {
  const counters = await prisma.bikeCounter.findMany();
  return counters;
}

export async function getCounterStats(counterId: string) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterdayStats = await prisma.counterTimeseries.aggregate({
    where: {
      counterId,
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
      counterId,
      date: {
        gte: today,
      },
    },
    _sum: {
      value: true,
    },
  });

  const lastPassageYesterday = await prisma.counterTimeseries.findFirst({
    where: {
      counterId,
      date: {
        gte: yesterday,
        lt: today,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  const lastPassageToday = await prisma.counterTimeseries.findFirst({
    where: {
      counterId,
      date: {
        gte: today,
      },
    },
    orderBy: {
      date: 'desc',
    },
  });

  const firstPassage = await prisma.counterTimeseries.findFirst({
    where: {
      counterId,
    },
    orderBy: {
      date: 'asc',
    },
  });

  const lastPassage = await prisma.counterTimeseries.findFirst({
    where: {
      counterId,
    },
    orderBy: {
      date: 'desc',
    },
  });

  return {
    yesterday: yesterdayStats._sum.value || 0,
    today: todayStats._sum.value || 0,
    firstPassageDate: firstPassage?.date || null,
    lastPassageDate: lastPassage?.date || null,
    lastPassageYesterday: lastPassageYesterday?.date || null,
    lastPassageToday: lastPassageToday?.date || null,
  };
}

export async function getGlobalStats() {
  const firstPassage = await prisma.counterTimeseries.findFirst({
    orderBy: {
      date: 'asc',
    },
  });

  const totalPassages = await prisma.counterTimeseries.aggregate({
    _sum: {
      value: true,
    },
  });

  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const activeCounters = await prisma.counterTimeseries.groupBy({
    by: ['counterId'],
    where: {
      date: {
        gte: twoMonthsAgo,
      },
    },
    _count: {
      counterId: true,
    },
  });

  const totalCounters = await prisma.bikeCounter.count();

  return {
    totalPassages: totalPassages._sum.value || 0,
    firstPassageDate: firstPassage?.date || null,
    totalCounters,
    activeCounters: activeCounters.length,
  };
}

export async function getCountersStatus() {
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  const activeCounters = await prisma.counterTimeseries.groupBy({
    by: ['counterId'],
    where: {
      date: {
        gte: twoMonthsAgo,
      },
    },
  });

  const activeCounterIds = new Set(activeCounters.map(c => c.counterId));

  return activeCounterIds;
}

export async function getEvolutionData() {
  const firstDate = await prisma.counterTimeseries.findFirst({
    orderBy: {
      date: 'asc',
    },
    select: {
      date: true,
    },
  });

  if (!firstDate) return [];

  const startDate = new Date(firstDate.date);
  const endDate = new Date();
  const years = new Set<number>();

  // Récupérer toutes les années disponibles
  for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
    years.add(d.getFullYear());
  }

  // Pour chaque année, récupérer les données hebdomadaires
  const evolutionData = await Promise.all(
    Array.from(years).map(async (year) => {
      // Récupérer toutes les données de l'année
      const yearData = await prisma.counterTimeseries.groupBy({
        by: ['date'],
        where: {
          date: {
            gte: new Date(year, 0, 1),
            lt: new Date(year + 1, 0, 1),
          },
        },
        _sum: {
          value: true,
        },
        orderBy: {
          date: 'asc',
        },
      });

      // Regrouper par semaine
      const weeklyData = Array.from({ length: 52 }, (_, weekIndex) => {
        const weekStart = new Date(year, 0, 1 + (weekIndex * 7));
        const weekEnd = new Date(year, 0, 1 + ((weekIndex + 1) * 7));

        const weekValues = yearData.filter(d => {
          const date = new Date(d.date);
          return date >= weekStart && date < weekEnd;
        });

        return {
          date: weekStart,
          value: weekValues.reduce((sum, curr) => sum + (curr._sum.value || 0), 0),
        };
      });

      return {
        year,
        data: weeklyData,
      };
    })
  );

  return evolutionData;
}

// Fonction utilitaire pour obtenir le numéro de semaine
function getWeekNumber(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

export async function getDailyStats() {
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

  // Météo pour toutes les zones - en une seule requête
  const weatherStats = await prisma.weatherTimeseries.groupBy({
    by: ['date'],
    where: {
      date: {
        gte: yesterday,
      },
      type: 'daily',
    },
    _max: {
      temperature2m: true,
    },
  });

  const yesterdayWeather = weatherStats.find(w => 
    w.date >= yesterday && w.date < today
  );
  const todayWeather = weatherStats.find(w => 
    w.date >= today
  );

  return {
    passages: {
      yesterday: yesterdayStats._sum.value || 0,
      today: todayStats._sum.value || 0,
    },
    weather: {
      yesterday: yesterdayWeather?._max.temperature2m ?? null,
      today: todayWeather?._max.temperature2m ?? null,
    },
  };
}