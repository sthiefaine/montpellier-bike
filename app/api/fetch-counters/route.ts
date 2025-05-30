export const maxDuration = 300;
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
function subMonths(date: Date, n: number) {
  return new Date(date.getFullYear(), date.getMonth() - n, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
}
function toISO(date: Date) {
  return date.toISOString();
}

async function fetchAndStoreForCounter(counterId: string, serialNumber: string, from: Date, to: Date) {
  const url = `https://portail-api-data.montpellier3m.fr/ecocounter_timeseries/urn%3Angsi-ld%3AEcoCounter%3A${serialNumber}/attrs/intensity?fromDate=${encodeURIComponent(toISO(from))}&toDate=${encodeURIComponent(toISO(to))}`;
  console.log('url', url)
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Erreur API pour ${serialNumber}`);
  const data = await res.json();

  if (!data.index || !data.values) return 0;
  let inserted = 0;
  for (let i = 0; i < data.index.length; i++) {
    const date = new Date(data.index[i]);
    const value = data.values[i];
    await prisma.counterTimeseries.upsert({
      where: { counterId_date: { counterId, date } },
      update: { value },
      create: { counterId, serialNumber, date, value },
    });
    inserted++;
  }
  return inserted;
}

export async function GET() {
  try {
    const counters = await prisma.bikeCounter.findMany();
    let totalInserted = 0;
    for (const counter of counters) {
      let month = 0;
      let done = false;
      while (!done && month < 12) {
        const now = subMonths(new Date(), 1);
        const from = startOfMonth(subMonths(now, month));
        const to = endOfMonth(subMonths(now, month));
        const count = await prisma.counterTimeseries.count({
          where: {
            counterId: counter.id,
            date: { gte: from, lte: to }
          }
        });
        if (count >= 24 * 28) {
          month++;
          continue;
        }
        const serialNumber = counter.serialNumber1 ?? counter.serialNumber;
        totalInserted += await fetchAndStoreForCounter(counter.id, serialNumber, from, to);
        done = true;
      }
    }
    return NextResponse.json({ ok: true, totalInserted });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}