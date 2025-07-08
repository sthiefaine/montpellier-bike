import { NextRequest, NextResponse } from "next/server";
import { getHourlyDistributionStats } from "@/actions/counters/daily";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    console.log('Route API appelée avec:', { startDate, endDate });

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Les paramètres startDate et endDate sont requis" },
        { status: 400 }
      );
    }

    const stats = await getHourlyDistributionStats(startDate, endDate);
    
    console.log('Stats retournées par l\'action:', stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erreur lors de la récupération des données de répartition horaire:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
} 