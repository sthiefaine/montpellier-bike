import { prisma } from "@/lib/prisma";
import {
  getStartOfDayParis,
  getEndOfDayParis,
  getStartOfWeekParis,
  getEndOfWeekParis,
  getStartOfMonthParis,
  getEndOfMonthParis,
  getStartOfYearParis,
  getEndOfYearParis,
} from "./dateHelpers";

export interface CounterValue {
  date: Date;
  value: number;
  serialNumber: string;
}

export interface AllCounterData {
  allValues: CounterValue[];
  counterIsActive: boolean;
}

export async function getAllCounterValues(
  counterId: string
): Promise<CounterValue[]> {
  const values = await prisma.counterTimeseries.findMany({
    where: {
      counterId: counterId,
    },
    select: {
      date: true,
      value: true,
      serialNumber: true,
    },
    orderBy: {
      date: "asc",
    },
  });

  return values.map((v) => ({
    ...v,
    date: new Date(v.date),
  }));
}

export async function getCounterIsActive(counterId: string): Promise<boolean> {
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const recentData = await prisma.counterTimeseries.findFirst({
    where: {
      counterId: counterId,
      date: {
        gte: twoWeeksAgo,
      },
    },
  });

  return !!recentData;
}

export function getValuesForPeriod(
  values: CounterValue[],
  startDate: Date,
  endDate: Date
): CounterValue[] {
  return values.filter((v) => v.date >= startDate && v.date <= endDate);
}

export function getValuesForYear(
  values: CounterValue[],
  year: number
): CounterValue[] {
  const yearDate = new Date(year, 6, 1);
  const startDate = getStartOfYearParis(yearDate);
  const endDate = getEndOfYearParis(yearDate);
  return getValuesForPeriod(values, startDate, endDate);
}

export function getValuesForMonth(
  values: CounterValue[],
  year: number,
  month: number
): CounterValue[] {
  const monthDate = new Date(year, month, 15); // Milieu du mois
  const startDate = getStartOfMonthParis(monthDate);
  const endDate = getEndOfMonthParis(monthDate);
  return getValuesForPeriod(values, startDate, endDate);
}

export function getValuesForWeek(
  values: CounterValue[],
  startOfWeek: Date
): CounterValue[] {
  const startDate = getStartOfWeekParis(startOfWeek);
  const endDate = getEndOfWeekParis(startOfWeek);
  return getValuesForPeriod(values, startDate, endDate);
}

export function getValuesForDay(
  values: CounterValue[],
  date: Date
): CounterValue[] {
  const startDate = getStartOfDayParis(date);
  const endDate = getEndOfDayParis(date);
  return getValuesForPeriod(values, startDate, endDate);
}

export function getValuesForLastNDays(
  values: CounterValue[],
  days: number
): CounterValue[] {
  const endDate = getEndOfDayParis(new Date());
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  const adjustedStartDate = getStartOfDayParis(startDate);
  return getValuesForPeriod(values, adjustedStartDate, endDate);
}

export function calculateStats(values: CounterValue[]) {
  if (values.length === 0)
    return { total: 0, average: 0, count: 0, max: 0, min: 0 };

  const total = values.reduce((sum, v) => sum + v.value, 0);
  const average = total / values.length;
  const max = Math.max(...values.map((v) => v.value));
  const min = Math.min(...values.map((v) => v.value));

  return { total, average, count: values.length, max, min };
}

export function calculateDailyStats(values: CounterValue[]) {
  const dailyMap = new Map<string, number>();

  values.forEach((v) => {
    const dayKey = v.date.toISOString().split("T")[0];
    dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + v.value);
  });

  return Array.from(dailyMap.entries()).map(([date, value]) => ({
    date: new Date(date),
    value,
  }));
}

export function calculateWeeklyStats(values: CounterValue[]) {
  const weeklyMap = new Map<string, number>();

  values.forEach((v) => {
    const weekStart = getStartOfWeekParis(v.date);
    const weekKey = weekStart.toISOString().split("T")[0];
    weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + v.value);
  });

  return Array.from(weeklyMap.entries()).map(([date, value]) => ({
    date: new Date(date),
    value,
  }));
}

export function calculateMonthlyStats(values: CounterValue[]) {
  const monthlyMap = new Map<string, number>();

  values.forEach((v) => {
    const monthStart = getStartOfMonthParis(v.date);
    const monthKey = monthStart.toISOString().split("T")[0];
    monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + v.value);
  });

  return Array.from(monthlyMap.entries()).map(([date, value]) => ({
    date: new Date(date),
    value,
  }));
}

export function calculateHourlyStats(values: CounterValue[]) {
  const hourlyMap = new Map<number, number>();

  values.forEach((v) => {
    const hour = v.date.getHours();
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + v.value);
  });

  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    value: hourlyMap.get(hour) || 0,
  }));
}

export function calculateHourlyStatsByDayOfWeek(values: CounterValue[]) {
  const hourlyByDayMap = new Map<string, Map<number, number>>();

  // Initialiser les maps pour chaque jour
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  days.forEach((day) => {
    hourlyByDayMap.set(day, new Map());
  });

  values.forEach((v) => {
    const dayOfWeek = v.date.getDay(); // 0 = dimanche, 1 = lundi, etc.
    const hour = v.date.getHours();

    // Convertir en clé de jour (lundi = 0, dimanche = 6)
    const dayKey = dayOfWeek === 0 ? "sunday" : days[dayOfWeek - 1];

    const dayMap = hourlyByDayMap.get(dayKey)!;
    dayMap.set(hour, (dayMap.get(hour) || 0) + v.value);
  });

  const result: Record<string, { hour: number; value: number }[]> = {};

  days.forEach((day) => {
    const dayMap = hourlyByDayMap.get(day)!;
    result[day] = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      value: dayMap.get(hour) || 0,
    }));
  });

  return result;
}

export function getAvailableYears(values: CounterValue[]) {
  if (values.length === 0)
    return { start: new Date().getFullYear(), end: new Date().getFullYear() };

  const years = values.map((v) => v.date.getFullYear());
  return {
    start: Math.min(...years),
    end: Math.max(...years),
  };
}

export function getAvailableWeeks(values: CounterValue[], year: number) {
  const yearValues = getValuesForYear(values, year);
  const weekSet = new Set<number>();

  yearValues.forEach((v) => {
    const weekStart = getStartOfWeekParis(v.date);
    const weekNumber = getWeekNumber(weekStart);
    weekSet.add(weekNumber);
  });

  return Array.from(weekSet).sort((a, b) => a - b);
}

export function getWeekNumber(date: Date): number {
  // Utiliser la norme ISO 8601 pour calculer le numéro de semaine
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

export function getWeekStartDate(year: number, week: number): Date {
  const start = new Date(year, 0, 1);
  const weekStart = getStartOfWeekParis(start);
  const result = new Date(weekStart);
  result.setDate(result.getDate() + (week - 1) * 7);
  return result;
}

export async function getAllCounterData(
  counterId: string
): Promise<AllCounterData> {
  const [allValues, counterIsActive] = await Promise.all([
    getAllCounterValues(counterId),
    getCounterIsActive(counterId),
  ]);

  return {
    allValues,
    counterIsActive,
  };
}
