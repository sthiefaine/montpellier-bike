import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  detectFirstDataDate,
  hasSerialNumberChanged,
  getCurrentSerialNumber,
} from "@/helpers";

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

    let createdCount = 0;
    let updatedCount = 0;
    let historyCount = 0;

    // Traitement de chaque compteur
    for (const counter of counters) {
      const currentSerialNumber = getCurrentSerialNumber(
        counter.serialNumber,
        counter.serialNumber1
      );

      // Chercher un compteur existant par numéro de série actuel
      let existingCounter = await prisma.bikeCounter.findFirst({
        where: {
          OR: [
            { serialNumber: currentSerialNumber },
            { serialNumber1: currentSerialNumber },
          ],
          isActive: true,
        },
      });

      if (!existingCounter) {
        const newCounter = await prisma.bikeCounter.create({
          data: {
            name: counter.name,
            serialNumber: counter.serialNumber,
            serialNumber1: counter.serialNumber1,
            latitude: counter.latitude,
            longitude: counter.longitude,
            osmLineId: counter.osmLineId,
            coordinates: counter.coordinates,
            isActive: true,
          },
        });
        createdCount++;
        console.log(
          `Nouveau compteur créé: ${newCounter.name} (${currentSerialNumber})`
        );
      } else {
        // Compteur existant - vérifier s'il y a eu un changement de numéro de série
        const oldSerialNumber = getCurrentSerialNumber(
          existingCounter.serialNumber,
          existingCounter.serialNumber1
        );

        if (hasSerialNumberChanged(oldSerialNumber, currentSerialNumber)) {
          console.log(
            `Changement de numéro de série détecté pour ${existingCounter.name}: ${oldSerialNumber} -> ${currentSerialNumber}`
          );

          // Désactiver l'ancien compteur
          await prisma.bikeCounter.update({
            where: { id: existingCounter.id },
            data: { isActive: false },
          });

          // Détecter la date de changement
          const changeDate = await detectFirstDataDate(currentSerialNumber);

          // Créer un nouvel enregistrement avec le nouveau numéro de série
          const newCounter = await prisma.bikeCounter.create({
            data: {
              name: counter.name,
              serialNumber: counter.serialNumber,
              serialNumber1: counter.serialNumber1,
              latitude: counter.latitude,
              longitude: counter.longitude,
              osmLineId: counter.osmLineId,
              coordinates: counter.coordinates,
              isActive: true,
              parentId: existingCounter.id,
            },
          });

          await prisma.counterHistory.create({
            data: {
              counter_id: newCounter.id,
              oldSerialNumber: oldSerialNumber,
              newSerialNumber: currentSerialNumber,
              changeDate: changeDate || new Date(),
              changeReason: "Changement de numéro de série détecté via API",
            },
          });

          historyCount++;
          console.log(
            `Historique enregistré pour ${newCounter.name}: ${oldSerialNumber} -> ${currentSerialNumber} (${changeDate})`
          );
        } else {
          await prisma.bikeCounter.update({
            where: { id: existingCounter.id },
            data: {
              name: counter.name,
              serialNumber: counter.serialNumber,
              serialNumber1: counter.serialNumber1,
              latitude: counter.latitude,
              longitude: counter.longitude,
              osmLineId: counter.osmLineId,
              coordinates: counter.coordinates,
            },
          });
          updatedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${createdCount} compteurs créés, ${updatedCount} mis à jour, ${historyCount} changements de numéro de série enregistrés`,
      stats: {
        created: createdCount,
        updated: updatedCount,
        history: historyCount,
        total: counters.length,
      },
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
