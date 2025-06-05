import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = request.nextUrl?.searchParams;
  const fromDate = searchParams?.get("fromDate") || "2025-06-04T00:00:00";
  const toDate = searchParams?.get("toDate") || "2025-06-04T23:59:59";
  const numero_serie = params.id || "ED223110494";

  console.log("Dates reçues dans l'API :", {
    fromDate,
    toDate,
    numero_serie,
  });

  const startDate = new Date(fromDate);
  const endDate = new Date(toDate);

  console.log("Dates converties en objets Date :", {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
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

  console.log("Premier et dernier enregistrement trouvés :", {
    first: timeseries[0]?.date.toISOString(),
    last: timeseries[timeseries.length - 1]?.date.toISOString(),
    count: timeseries.length,
  });

  const response = {
    somme: timeseries.reduce((acc, ts) => acc + ts.value, 0),
    attrName: "intensity",
    entityId: `urn:ngsi-ld:EcoCounter:${numero_serie}`,
    entityType: "EcoCounter",
    index: timeseries.map((ts) => ts.date.toISOString()),
    values: timeseries.map((ts) => ts.value),
  };

  return NextResponse.json(response);
}
