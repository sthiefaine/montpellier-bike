import { prisma } from "@/lib/prisma";
import { BikeCounter } from "@prisma/client";

export async function getCounters(): Promise<BikeCounter[]> {
  const counters = await prisma.bikeCounter.findMany();
  return counters;
}

export async function getCounterIsActive(counterId: string): Promise<boolean> {
  const sinceDate = new Date();
  sinceDate.setUTCDate(sinceDate.getUTCDate() - 14);

  const activeCounter = await prisma.counterTimeseries.findFirst({
    where: {
      date: {
        gte: sinceDate,
      },
      counterId,
    },
  });

  return activeCounter !== null;
}
