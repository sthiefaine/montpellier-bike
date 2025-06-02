export const maxDuration = 300;
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function toISO(date: Date) {
  return date.toISOString();
}

async function fetchAndStoreForCounter(counterId: string, serialNumber: string, from: Date) {
  const url = `https://portail-api-data.montpellier3m.fr/ecocounter_timeseries/urn%3Angsi-ld%3AEcoCounter%3A${serialNumber}/attrs/intensity?fromDate=${encodeURIComponent(toISO(from))}`;
  console.log('url', url)
  const res = await fetch(url, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`Erreur API pour ${serialNumber}`);
  const data = await res.json();

  if (!data.index || !data.values) {
    console.log(`[fetch-counters] Pas de données pour le compteur ${serialNumber} sur la période ${from.toISOString()}`);
    return 0;
  }

  const records = data.index.map((dateStr: string, i: number) => ({
    counterId,
    serialNumber,
    date: new Date(dateStr),
    value: data.values[i]
  }));

  // On utilise createMany avec skipDuplicates pour éviter les doublons
  const result = await prisma.counterTimeseries.createMany({
    data: records,
    skipDuplicates: true,
  });

  return result.count;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get('from');
    const counterParam = searchParams.get('counter');
    
    if (!fromParam) return NextResponse.json({ ok: false, error: 'from param required' }, { status: 400 });
    const from = new Date(fromParam);

    let counters;
    if (counterParam) {
      // Si on a un paramètre counter, on ne prend que le compteur spécifié
      const counter = await prisma.bikeCounter.findFirst({
        where: { id: counterParam }
      });
      counters = counter ? [counter] : [];
    } else {
      counters = await prisma.bikeCounter.findMany();
    }

    let totalInserted = 0;
    for (const counter of counters) {
      const serialNumber = counter.serialNumber1 ?? counter.serialNumber;
      try {
        totalInserted += await fetchAndStoreForCounter(counter.id, serialNumber, from);
      } catch (err) {
        console.error(`[fetch-counters] Erreur pour le compteur ${serialNumber}:`, err);
      }
    }
    return NextResponse.json({ ok: true, totalInserted });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}