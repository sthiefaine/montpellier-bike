import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSerialNumber } from "@/helpers";

const API_KEY = process.env.API_KEY_COUNTERS;

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get("id");

    if (!API_KEY) {
      console.error(
        "[fetch-data-counters/since] API_KEY_COUNTERS n'est pas configurée"
      );
      return NextResponse.json(
        {
          ok: false,
          error: "Configuration du serveur invalide",
        },
        { status: 500 }
      );
    }

    if (!apiKey || apiKey !== API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: "Clé d'API invalide ou manquante",
        },
        { status: 401 }
      );
    }

    // Valider le format de la date (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Format de date invalide. Utilisez YYYY-MM-DD",
        },
        { status: 400 }
      );
    }

    const from = new Date(date);
    from.setHours(0, 0, 0, 0);

    // Vérifier si la date est valide
    if (isNaN(from.getTime())) {
      return NextResponse.json(
        {
          ok: false,
          error: "Date invalide",
        },
        { status: 400 }
      );
    }

    // Ne récupérer que les compteurs actifs
    const counters = await prisma.bikeCounter.findMany({
      where: { isActive: true }
    });
    
    let totalInserted = 0;

    for (const counter of counters) {
      // Utiliser la fonction helper pour déterminer le bon numéro de série
      const serialNumber = getCurrentSerialNumber(counter.serialNumber, counter.serialNumber1);
      
      try {
        const inserted = await fetchAndStoreForCounter(
          counter.id,
          serialNumber,
          from
        );
        totalInserted += inserted;
        console.log(
          `[fetch-data-counters/since] ${inserted} enregistrements insérés pour le compteur ${serialNumber}`
        );
      } catch (err) {
        console.error(
          `[fetch-data-counters/since] Erreur pour le compteur ${serialNumber}:`,
          err
        );
      }
    }

    return NextResponse.json({
      ok: true,
      totalInserted,
      message: `${totalInserted} enregistrements insérés depuis ${date}`,
    });
  } catch (e: any) {
    console.error("[fetch-data-counters/since] Erreur:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e.message,
      },
      { status: 500 }
    );
  }
}
