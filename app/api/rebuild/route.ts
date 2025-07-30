import { NextResponse } from "next/server";

const COOLIFY_RESOURCE_ID = process.env.COOLIFY_RESOURCE_ID;

export async function GET() {
  try {
    console.log("[rebuild] Début de l'exécution");

    if (!COOLIFY_RESOURCE_ID) {
      console.error("[rebuild] COOLIFY_RESOURCE_ID n'est pas configuré");
      throw new Error("COOLIFY_RESOURCE_ID n'est pas configuré");
    }

    console.log(
      "[rebuild] COOLIFY_RESOURCE_ID configuré:",
      COOLIFY_RESOURCE_ID.substring(0, 50) + "..."
    );

    const now = new Date();
    const parisTime = new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    const [parisHour, parisMinutes] = parisTime.split(":").map(Number);

    console.log(`[rebuild] Heure de Paris: ${parisHour}h${parisMinutes}`);

    if (parisHour !== 7) {
      console.log(
        `[rebuild] Rebuild ignoré - heure de Paris: ${parisHour}h${parisMinutes}`
      );
      return NextResponse.json({
        success: false,
        message: `Rebuild ignoré - heure de Paris: ${parisHour}h${parisMinutes}`,
      });
    }

    console.log("[rebuild] Déclenchement du rebuild...");

    const response = await fetch(
      `${process.env.COOLIFY_URL}/api/v1/deploy?uuid=${COOLIFY_RESOURCE_ID}&force=false`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.COOLIFY_API_TOKEN}`,
        },
      }
    );

    console.log(
      "[rebuild] Réponse du deploy hook:",
      response.status,
      response.statusText
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[rebuild] Erreur response:", errorText);
      throw new Error(
        `Erreur lors du rebuild: ${response.status} ${response.statusText}`
      );
    }

    const responseData = await response.json();
    console.log("[rebuild] Réponse complète:", responseData);

    return NextResponse.json({
      success: true,
      message: `Rebuild déclenché avec succès - heure de Paris: ${parisHour}h${parisMinutes}`,
      jobId: responseData.job?.id,
    });
  } catch (error) {
    console.error("[rebuild] Erreur lors du rebuild:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Erreur lors du rebuild",
      },
      { status: 500 }
    );
  }
}
