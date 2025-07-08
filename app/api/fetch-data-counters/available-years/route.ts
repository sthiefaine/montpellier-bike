import { NextRequest, NextResponse } from "next/server";
import { getAvailableYears } from "@/actions/counters/daily";

export async function GET(request: NextRequest) {
  try {
    const years = await getAvailableYears();
    return NextResponse.json(years);
  } catch (error) {
    console.error("Erreur lors de la récupération des années disponibles:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des années disponibles" },
      { status: 500 }
    );
  }
} 