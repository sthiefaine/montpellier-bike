'use server';
import { prisma } from '@/lib/prisma';
import { BikeCounter } from '@prisma/client';

export async function getCounters(): Promise<BikeCounter[]> {
  const counters = await prisma.bikeCounter.findMany();
  return counters;
}