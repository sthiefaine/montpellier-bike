import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const searchParams = request.nextUrl?.searchParams;
  const fromDate = searchParams?.get("fromDate") || "2025-06-05";
  const toDate = searchParams?.get("toDate") || "2025-06-05";
  const numero_serie = (await params).id || "ED223110494";
  const timeZone = "Europe/Paris";

  // Pour la base de données : on commence à 1h et on termine à 0h de la journée suivante
  const startDate = new Date(fromDate);
  startDate.setUTCHours(1, 0, 0, 0);

  const endDate = new Date(toDate);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  endDate.setUTCHours(0, 0, 0, 0);

  // Pour l'API OpenData : on commence à 22h et on termine à 23h en heure de Paris
  const openDataStartDate = new Date(fromDate);
  openDataStartDate.setUTCDate(openDataStartDate.getUTCDate() - 1);
  openDataStartDate.setUTCHours(23, 0, 0, 0);

  const openDataEndDate = new Date(toDate);
  openDataEndDate.setUTCHours(22, 0, 0, 0);

  const openDataStartDateISO = openDataStartDate.toISOString();
  const openDataEndDateISO = openDataEndDate.toISOString();

  const counter = await prisma.bikeCounter.findFirst({
    where: {
      serialNumber: numero_serie,
    },
    select: {
      name: true,
    },
  });

  const timeseries = await prisma.$queryRaw<{ date: Date; value: number }[]>(
    Prisma.sql`
      SELECT 
        date,
        value
      FROM "CounterTimeseries"
      WHERE "serialNumber" = ${numero_serie}
        AND date >= ${startDate} AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'
        AND date <= ${endDate} AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris'
      ORDER BY date ASC
    `
  );

  let openDataValues: { index: string[]; values: number[] } = { index: [], values: [] };
  let openDataSomme = 0;

  try {
    const url = `https://portail-api-data.montpellier3m.fr/ecocounter_timeseries/urn%3Angsi-ld%3AEcoCounter%3A${numero_serie}/attrs/intensity?fromDate=${openDataStartDateISO}&toDate=${openDataEndDateISO}`;
    console.log("URL:", url);

    const openData = await fetch(url);

    if (!openData.ok) {
      throw new Error(`Erreur OpenData: ${openData.status} ${openData.statusText}`);
    }

    openDataValues = await openData.json() as {
      index: string[];
      values: number[];
    };
    openDataSomme = openDataValues.values.reduce((acc, value) => acc + value, 0);
  } catch (error) {
    console.error("Erreur lors de la récupération des données OpenData:", error);
  }

  const response = {
    somme: timeseries.reduce((acc, ts) => acc + ts.value, 0),
    name: counter?.name,
    attrName: "intensity",
    entityId: `urn:ngsi-ld:EcoCounter:${numero_serie}`,
    entityType: "EcoCounter",
    index: timeseries.map((ts) => ts.date.toISOString()),
    values: timeseries.map((ts) => ts.value),
    openDataIndex: openDataValues.index,
    openDataValues: openDataValues.values,
    openDataSomme
  };

  return NextResponse.json(response);
}
