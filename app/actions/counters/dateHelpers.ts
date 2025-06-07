/**
 * Fonctions utilitaires pour la gestion des dates dans le contexte des compteurs
 */

const TIMEZONE = "Europe/Paris";

/**
 * Convertit une date UTC vers l'heure de Paris
 * @param date Date UTC à convertir
 * @returns Date en heure de Paris
 */
export function toParisTime(date: Date): Date {
  // Créer une nouvelle date à partir du timestamp
  const utcTime = date.getTime();

  // Obtenir le décalage horaire de Paris pour cette date
  const parisOffset = getParisTimezoneOffset(date);

  // Appliquer le décalage
  return new Date(utcTime + parisOffset * 60 * 60 * 1000);
}

/**
 * Convertit une date de Paris vers UTC
 * @param parisDate Date en heure de Paris
 * @returns Date UTC
 */
export function toUTC(parisDate: Date): Date {
  // Créer une date temporaire pour calculer le décalage
  const tempDate = new Date(parisDate.getTime());
  const parisOffset = getParisTimezoneOffset(tempDate);

  // Soustraire le décalage pour obtenir UTC
  return new Date(parisDate.getTime() - parisOffset * 60 * 60 * 1000);
}

/**
 * Calcule le décalage horaire de Paris pour une date donnée
 * @param date Date pour laquelle calculer le décalage
 * @returns Décalage en heures entre Paris et UTC (positif = en avance sur UTC)
 */
export function getParisTimezoneOffset(date: Date): number {
  // Utiliser Intl.DateTimeFormat pour obtenir le décalage correct
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: TIMEZONE,
    timeZoneName: "longOffset",
  });

  const parts = formatter.formatToParts(date);
  const offsetString = parts.find(
    (part) => part.type === "timeZoneName"
  )?.value;

  if (!offsetString) {
    // Fallback : utiliser la différence entre les timestamps
    const utcTime = date.getTime();
    const parisTime = new Date(
      date.toLocaleString("en-US", { timeZone: TIMEZONE })
    ).getTime();
    return (parisTime - utcTime) / (1000 * 60 * 60);
  }

  // Parser le format "+02:00" ou "-01:00"
  const match = offsetString.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (match) {
    const sign = match[1] === "+" ? 1 : -1;
    const hours = parseInt(match[2], 10);
    const minutes = parseInt(match[3], 10);
    return sign * (hours + minutes / 60);
  }

  return 0; // Fallback
}

/**
 * Calcule le début d'une journée (00h00) en heure de Paris
 * @param date Date de référence (peut être UTC ou Paris)
 * @returns Date du début de la journée en heure de Paris
 */
export function getStartOfDay(date: Date): Date {
  const parisDate = toParisTime(date);
  const start = new Date(parisDate);
  start.setHours(0, 0, 0, 0);
  return start;
}

/**
 * Calcule la fin d'une journée (23h59) en heure de Paris
 * @param date Date de référence (peut être UTC ou Paris)
 * @returns Date de la fin de la journée en heure de Paris
 */
export function getEndOfDay(date: Date): Date {
  const parisDate = toParisTime(date);
  const end = new Date(parisDate);
  end.setHours(23, 59, 59, 999);
  return end;
}

/**
 * Calcule le début d'une journée en UTC pour une date donnée en heure de Paris
 * @param date Date de référence
 * @returns Date du début de la journée convertie en UTC
 */
export function getStartOfDayUTC(date: Date): Date {
  const startParis = getStartOfDay(date);
  return toUTC(startParis);
}

/**
 * Calcule la fin d'une journée en UTC pour une date donnée en heure de Paris
 * @param date Date de référence
 * @returns Date de la fin de la journée convertie en UTC
 */
export function getEndOfDayUTC(date: Date): Date {
  const endParis = getEndOfDay(date);
  return toUTC(endParis);
}

/**
 * Calcule le début de la semaine (lundi 00h00) en heure de Paris
 * @param date Date de référence
 * @returns Date du début de la semaine en heure de Paris
 */
export function getStartOfWeek(date: Date): Date {
  const parisDate = toParisTime(date);
  const day = parisDate.getDay();
  const diff = parisDate.getDate() - day + (day === 0 ? -6 : 1);
  parisDate.setDate(diff);
  parisDate.setHours(0, 0, 0, 0);
  return parisDate;
}

/**
 * Calcule la fin de la semaine (dimanche 23h59) en heure de Paris
 * @param date Date de référence
 * @returns Date de la fin de la semaine en heure de Paris
 */
export function getEndOfWeek(date: Date): Date {
  const parisDate = toParisTime(date);
  const day = parisDate.getDay();
  const diff = parisDate.getDate() - day + (day === 0 ? 0 : 7);
  parisDate.setDate(diff);
  parisDate.setHours(23, 59, 59, 999);
  return parisDate;
}

/**
 * Calcule le début de la semaine en UTC
 * @param date Date de référence
 * @returns Date du début de la semaine convertie en UTC
 */
export function getStartOfWeekUTC(date: Date): Date {
  const startParis = getStartOfWeek(date);
  return toUTC(startParis);
}

/**
 * Calcule la fin de la semaine en UTC
 * @param date Date de référence
 * @returns Date de la fin de la semaine convertie en UTC
 */
export function getEndOfWeekUTC(date: Date): Date {
  const endParis = getEndOfWeek(date);
  return toUTC(endParis);
}

/**
 * Calcule le début du mois (1er jour 00h00) en heure de Paris
 * @param date Date de référence
 * @returns Date du début du mois en heure de Paris
 */
export function getStartOfMonth(date: Date): Date {
  const parisDate = toParisTime(date);
  parisDate.setDate(1);
  parisDate.setHours(0, 0, 0, 0);
  return parisDate;
}

/**
 * Calcule la fin du mois (dernier jour 23h59) en heure de Paris
 * @param date Date de référence
 * @returns Date de la fin du mois en heure de Paris
 */
export function getEndOfMonth(date: Date): Date {
  const parisDate = toParisTime(date);
  parisDate.setMonth(parisDate.getMonth() + 1);
  parisDate.setDate(0);
  parisDate.setHours(23, 59, 59, 999);
  return parisDate;
}

/**
 * Calcule le début du mois en UTC
 * @param date Date de référence
 * @returns Date du début du mois convertie en UTC
 */
export function getStartOfMonthUTC(date: Date): Date {
  const startParis = getStartOfMonth(date);
  return toUTC(startParis);
}

/**
 * Calcule la fin du mois en UTC
 * @param date Date de référence
 * @returns Date de la fin du mois convertie en UTC
 */
export function getEndOfMonthUTC(date: Date): Date {
  const endParis = getEndOfMonth(date);
  return toUTC(endParis);
}

/**
 * Calcule le début de l'année (1er janvier 00h00) en heure de Paris
 * @param date Date de référence
 * @returns Date du début de l'année en heure de Paris
 */
export function getStartOfYear(date: Date): Date {
  const parisDate = toParisTime(date);
  parisDate.setFullYear(parisDate.getFullYear(), 0, 1);
  parisDate.setHours(0, 0, 0, 0);
  return parisDate;
}

/**
 * Calcule la fin de l'année (31 décembre 23h59) en heure de Paris
 * @param date Date de référence
 * @returns Date de la fin de l'année en heure de Paris
 */
export function getEndOfYear(date: Date): Date {
  const parisDate = toParisTime(date);
  parisDate.setFullYear(parisDate.getFullYear() + 1, 0, 0);
  parisDate.setHours(23, 59, 59, 999);
  return parisDate;
}

/**
 * Calcule le début de l'année en UTC
 * @param date Date de référence
 * @returns Date du début de l'année convertie en UTC
 */
export function getStartOfYearUTC(date: Date): Date {
  const startParis = getStartOfYear(date);
  return toUTC(startParis);
}

/**
 * Calcule la fin de l'année en UTC
 * @param date Date de référence
 * @returns Date de la fin de l'année convertie en UTC
 */
export function getEndOfYearUTC(date: Date): Date {
  const endParis = getEndOfYear(date);
  return toUTC(endParis);
}

/**
 * Génère un tableau d'heures pour une journée donnée en heure de Paris
 * @param date Date de référence
 * @returns Tableau de 24 dates représentant chaque heure de la journée en UTC
 */
export function getHoursOfDayUTC(date: Date): Date[] {
  const startParis = getStartOfDay(date);
  const hours: Date[] = [];

  for (let i = 0; i < 24; i++) {
    const hour = new Date(startParis);
    hour.setHours(i, 0, 0, 0);
    hours.push(toUTC(hour));
  }

  return hours;
}

/**
 * Génère un tableau de jours pour une semaine donnée
 * @param date Date de référence
 * @returns Tableau de 7 dates représentant chaque jour de la semaine en UTC
 */
export function getDaysOfWeekUTC(date: Date): Date[] {
  const startParis = getStartOfWeek(date);
  const days: Date[] = [];

  for (let i = 0; i < 7; i++) {
    const day = new Date(startParis);
    day.setDate(startParis.getDate() + i);
    days.push(toUTC(day));
  }

  return days;
}

/**
 * Génère un tableau de jours pour un mois donné
 * @param date Date de référence
 * @returns Tableau de dates représentant chaque jour du mois en UTC
 */
export function getDaysOfMonthUTC(date: Date): Date[] {
  const startParis = getStartOfMonth(date);
  const endParis = getEndOfMonth(date);
  const days: Date[] = [];

  const current = new Date(startParis);
  while (current <= endParis) {
    days.push(toUTC(new Date(current)));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Formate une date en heure de Paris pour l'affichage
 * @param date Date à formater
 * @param options Options de formatage
 * @returns Chaîne formatée
 */
export function formatParisTime(
  date: Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };

  return new Intl.DateTimeFormat("fr-FR", {
    ...defaultOptions,
    ...options,
  }).format(date);
}

/**
 * Formate une date pour l'affichage en français (date uniquement)
 * @param date Date à formater
 * @returns Chaîne formatée (ex: "05/06/2025")
 */
export function formatParisDate(date: Date): string {
  return formatParisTime(date, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/**
 * Formate une heure pour l'affichage en français
 * @param date Date à formater
 * @returns Chaîne formatée (ex: "14:30")
 */
export function formatParisHour(date: Date): string {
  return formatParisTime(date, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formate une date en format long français
 * @param date Date à formater
 * @returns Chaîne formatée (ex: "vendredi 5 juin 2025")
 */
export function formatParisDateLong(date: Date): string {
  return formatParisTime(date, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formate une date en format court français
 * @param date Date à formater
 * @returns Chaîne formatée (ex: "ven. 5 juin")
 */
export function formatParisDateShort(date: Date): string {
  return formatParisTime(date, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Convertit une date de Paris en UTC pour l'API OpenData
 * @param date Date en heure de Paris
 * @returns Date en UTC
 */
export function toUTCForOpenData(date: Date): Date {
  return toUTC(date);
}

/**
 * Vérifie si une date est aujourd'hui en heure de Paris
 * @param date Date à vérifier
 * @returns True si la date est aujourd'hui
 */
export function isToday(date: Date): boolean {
  const today = toParisTime(new Date());
  const checkDate = toParisTime(date);

  return (
    today.getFullYear() === checkDate.getFullYear() &&
    today.getMonth() === checkDate.getMonth() &&
    today.getDate() === checkDate.getDate()
  );
}

/**
 * Vérifie si une date est hier en heure de Paris
 * @param date Date à vérifier
 * @returns True si la date est hier
 */
export function isYesterday(date: Date): boolean {
  const today = toParisTime(new Date());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const checkDate = toParisTime(date);

  return (
    yesterday.getFullYear() === checkDate.getFullYear() &&
    yesterday.getMonth() === checkDate.getMonth() &&
    yesterday.getDate() === checkDate.getDate()
  );
}

/**
 * Calcule la différence en jours entre deux dates en heure de Paris
 * @param date1 Première date
 * @param date2 Deuxième date
 * @returns Nombre de jours de différence
 */
export function daysDifference(date1: Date, date2: Date): number {
  const paris1 = toParisTime(date1);
  const paris2 = toParisTime(date2);

  const start1 = getStartOfDay(paris1);
  const start2 = getStartOfDay(paris2);

  const diffTime = Math.abs(start2.getTime() - start1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Ajoute des jours à une date en heure de Paris
 * @param date Date de base
 * @param days Nombre de jours à ajouter
 * @returns Nouvelle date
 */
export function addDays(date: Date, days: number): Date {
  const parisDate = toParisTime(date);
  const result = new Date(parisDate);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Soustrait des jours à une date en heure de Paris
 * @param date Date de base
 * @param days Nombre de jours à soustraire
 * @returns Nouvelle date
 */
export function subtractDays(date: Date, days: number): Date {
  return addDays(date, -days);
}
