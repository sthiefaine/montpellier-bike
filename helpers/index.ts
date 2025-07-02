const dayFormatter = new Intl.DateTimeFormat("fr-FR", { weekday: "long" });

export const WEEK_DAYS_CONFIG = {
  monday: {
    key: "monday",
    name: dayFormatter.format(new Date(2024, 0, 1)),
    color: "#9333EA",
  },
  tuesday: {
    key: "tuesday",
    name: dayFormatter.format(new Date(2024, 0, 2)),
    color: "#2563eb",
  },
  wednesday: {
    key: "wednesday",
    name: dayFormatter.format(new Date(2024, 0, 3)),
    color: "#00FF00",
  },
  thursday: {
    key: "thursday",
    name: dayFormatter.format(new Date(2024, 0, 4)),
    color: "#FF0000",
  },
  friday: {
    key: "friday",
    name: dayFormatter.format(new Date(2024, 0, 5)),
    color: "#f59e0b",
  },
  saturday: {
    key: "saturday",
    name: dayFormatter.format(new Date(2024, 0, 6)),
    color: "#FFE000",
  },
  sunday: {
    key: "sunday",
    name: dayFormatter.format(new Date(2024, 0, 7)),
    color: "#14b8a6",
  },
} as const;

/**
 * Détecte la première date de données disponibles pour un numéro de série
 */
export async function detectFirstDataDate(
  serialNumber: string
): Promise<Date | null> {
  try {
    // On teste depuis 2020 pour être sûr de capturer le changement
    const url = `https://portail-api-data.montpellier3m.fr/ecocounter_timeseries/urn%3Angsi-ld%3AEcoCounter%3A${serialNumber}/attrs/intensity?fromDate=2020-01-01T00%3A00%3A00`;

    const response = await fetch(url, {
      headers: { accept: "application/json" },
      // Timeout de 10 secondes
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (!data.index || !Array.isArray(data.index) || data.index.length === 0) {
      return null;
    }

    // Retourne la première date disponible
    return new Date(data.index[0]);
  } catch (error) {
    console.error(
      `Erreur lors de la détection de la première date pour ${serialNumber}:`,
      error
    );
    return null;
  }
}

/**
 * Compare deux numéros de série et détermine s'il y a eu un changement
 */
export function hasSerialNumberChanged(
  oldSerial: string,
  newSerial: string
): boolean {
  return oldSerial !== newSerial;
}

/**
 * Trouve le numéro de série actuel à utiliser pour un compteur
 */
export function getCurrentSerialNumber(
  serialNumber: string,
  serialNumber1: string | null
): string {
  // si serial number commence par "COM" on l'utilise
  if (serialNumber.startsWith("COM")) {
    return serialNumber;
  }
  // Si serialNumber1 existe et commence par une lettre, on l'utilise
  if (serialNumber1 && /^[a-zA-Z]/.test(serialNumber1)) {
    return serialNumber1;
  }
  return serialNumber;
}
