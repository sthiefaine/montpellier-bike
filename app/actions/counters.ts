'use server';
import { prisma } from '@/lib/prisma';
import { BikeCounter } from '@prisma/client';

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