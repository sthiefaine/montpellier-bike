import { NextRequest, NextResponse } from "next/server";
import { fetchAndStoreWeather } from "@/actions/weather";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
      });
    }

    console.log("Cron job météo démarré à", new Date().toISOString());

    const weatherData = await fetchAndStoreWeather();

    console.log("Cron job météo terminé avec succès:", weatherData);

    return NextResponse.json({
      success: true,
      message: "Météo récupérée et stockée avec succès",
      data: weatherData,
    });
  } catch (error) {
    console.error("Erreur lors du cron job météo:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération de la météo",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
