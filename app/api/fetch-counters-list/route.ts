import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const COUNTERS_GEOJSON_URL =
  "https://data.montpellier3m.fr/sites/default/files/ressources/MMM_MMM_GeolocCompteurs.geojson";

export async function GET() {
  try {
    const response = await fetch(COUNTERS_GEOJSON_URL);
    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) {
      throw new Error("Format de données invalide");
    }

    const counters = data.features.map((feature: any) => ({
      name: feature.properties["Nom du com"],
      serialNumber: feature.properties["N° Série"],
      serialNumber1: feature.properties["N° Sér_1"],
      latitude: feature.properties.Latitude,
      longitude: feature.properties.Longitude,
      osmLineId: feature.properties.OSM_Line_i,
      coordinates: feature.geometry.coordinates,
    }));

    // Mise à jour ou création des compteurs
    for (const counter of counters) {
      await prisma.bikeCounter.upsert({
        where: {
          serialNumber: counter.serialNumber,
        },
        update: {
          name: counter.name,
          serialNumber1: counter.serialNumber1,
          latitude: counter.latitude,
          longitude: counter.longitude,
          osmLineId: counter.osmLineId,
          coordinates: counter.coordinates,
        },
        create: {
          name: counter.name,
          serialNumber: counter.serialNumber,
          serialNumber1: counter.serialNumber1,
          latitude: counter.latitude,
          longitude: counter.longitude,
          osmLineId: counter.osmLineId,
          coordinates: counter.coordinates,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `${counters.length} compteurs mis à jour avec succès`,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des compteurs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour des compteurs",
      },
      { status: 500 }
    );
  }
}
