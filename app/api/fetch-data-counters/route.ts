import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBeforeYesterdayBoundsParis } from "@/actions/counters/dateHelpers";
import { getCurrentSerialNumber } from "@/helpers";

function toISO(date: Date) {
  return date.toISOString();
}

async function fetchAndStoreForCounter(
  counterId: string,
  serialNumber: string,
  from: Date
) {
  const url = `https://portail-api-data.montpellier3m.fr/ecocounter_timeseries/urn%3Angsi-ld%3AEcoCounter%3A${serialNumber}/attrs/intensity?fromDate=${encodeURIComponent(
    toISO(from)
  )}`;
  console.log("url", url);
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Erreur API pour ${serialNumber}`);
  const data = await res.json();

  if (!data.index || !data.values) {
    console.log(
      `[fetch-data-counters] Pas de données pour le compteur ${serialNumber} sur la période ${from.toISOString()}`
    );
    return 0;
  }

  const records = data.index.map((dateStr: string, i: number) => ({
    counterId,
    serialNumber,
    date: new Date(dateStr),
    value: data.values[i],
  }));

  const result = await prisma.counterTimeseries.createMany({
    data: records,
    skipDuplicates: true,
  });

  return result.count;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const counterParam = searchParams.get("counter");
    const fromParam = searchParams.get("from");

    const from = fromParam
      ? new Date(fromParam)
      : getBeforeYesterdayBoundsParis().start;

    let counters;
    if (counterParam) {
      // Pour un compteur spécifique, on cherche le plus récent (actif)
      const counter = await prisma.bikeCounter.findFirst({
        where: { isActive: true },
        orderBy: { updatedAt: "desc" },
      });
      counters = counter ? [counter] : [];
    } else {
      // Pour tous les compteurs, on ne prend que les actifs
      counters = await prisma.bikeCounter.findMany({
        where: { isActive: true },
      });
    }

    let totalInserted = 0;
    for (const counter of counters) {
      const serialNumber = getCurrentSerialNumber(
        counter.serialNumber,
        counter.serialNumber1
      );

      try {
        totalInserted += await fetchAndStoreForCounter(
          counter.id,
          serialNumber,
          from
        );
      } catch (err) {
        console.error(
          `[fetch-data-counters] Erreur pour le compteur ${serialNumber}:`,
          err
        );
      }
    }
    return NextResponse.json({ ok: true, totalInserted });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
