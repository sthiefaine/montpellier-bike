import { NextRequest, NextResponse } from "next/server";
import { getGlobalAndByDayHourlyStats } from "@/actions/counters/daily";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Les paramètres startDate et endDate sont requis" },
        { status: 400 }
      );
    }

    const stats = await getGlobalAndByDayHourlyStats(startDate, endDate);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erreur lors de la récupération des stats horaires globales et par jour:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des stats horaires" },
      { status: 500 }
    );
  }
} 