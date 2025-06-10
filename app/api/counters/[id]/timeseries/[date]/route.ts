import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getStartOfDay, getEndOfDay } from "@/actions/counters/dateHelpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, date: string }> }
) {
  const date = (await params).date || "2025-06-09";
  const numero_serie = (await params).id || "X2H21070351";
  const startDate = getStartOfDay(new Date(date));
  const endDate = getEndOfDay(new Date(date));

  const openDataStartDate = new Date(date);
  const openDataStartDateParis = getStartOfDay(openDataStartDate);

  const openDataEndDate = new Date(date);
  const openDataEndDateParis = getEndOfDay(openDataEndDate);

  const openDataStartDateISO = openDataStartDateParis.toISOString().slice(0, 19);
  const openDataEndDateISO = openDataEndDateParis.toISOString().slice(0, 19);

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
        AND date >= ${startDate}
        AND date <= ${endDate}
      ORDER BY date ASC
    `
  );

  let openDataValues: { index: string[]; values: number[] } = { index: [], values: [] };
  let openDataSomme = 0;
  let url = `https://portail-api-data.montpellier3m.fr/ecocounter_timeseries/urn%3Angsi-ld%3AEcoCounter%3A${numero_serie}/attrs/intensity?fromDate=${openDataStartDateISO}&toDate=${openDataEndDateISO}`;

  try {
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
    index: timeseries.map((ts) => ts.date),
    values: timeseries.map((ts) => ts.value),
    openDataIndex: openDataValues.index,
    openDataValues: openDataValues.values,
    openDataSomme,
    debug: {
      urlOpenData: url,
      startDate,
      endDate,
      openDataStartDateParis,
      openDataEndDateParis,
      openDataStartDateISO,
      openDataEndDateISO,
    }
  };

  return NextResponse.json(response);
}
