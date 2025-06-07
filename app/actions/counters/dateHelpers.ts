/**
 * Fonctions utilitaires pour la gestion des dates dans le contexte des compteurs
 * Toutes les dates sont calculées en fonction du fuseau horaire Europe/Paris
 */

const TIMEZONE = "Europe/Paris";

/**
 * Version simplifiée et fiable pour le début de journée
 */
export function getStartOfDayParis(date: Date): Date {
  // Obtenir la date au format YYYY-MM-DD en heure de Paris
  const parisDateStr = date.toLocaleDateString("en-CA", { timeZone: TIMEZONE });

  // Créer une date temporaire pour déterminer l'offset
  const testDate = new Date(parisDateStr + "T12:00:00Z");
  const parisTestHour = new Date(
    testDate.toLocaleString("en-US", { timeZone: TIMEZONE })
  ).getHours();
  const utcTestHour = testDate.getUTCHours();

  // Calculer l'offset de Paris par rapport à UTC
  let offset = parisTestHour - utcTestHour;
  if (offset > 12) offset -= 24;
  if (offset < -12) offset += 24;

  // Créer la date de début de journée en UTC
  const result = new Date(parisDateStr + "T00:00:00Z");
  result.setUTCHours(result.getUTCHours() - offset);

  return result;
}

/**
 * Calcule la fin d'une journée (23h59:59.999) en heure de Paris
 * @param date Date de référence
 * @returns Date de la fin de la journée en UTC mais correspondant à 23h59 Paris
 */
export function getEndOfDayParis(date: Date): Date {
  const startOfDay = getStartOfDayParis(date);
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
  return endOfDay;
}

/**
 * Calcule le début de la semaine (lundi 00h00) en heure de Paris
 * @param date Date de référence
 * @returns Date du début de la semaine
 */
export function getStartOfWeekParis(date: Date): Date {
  const parisDate = new Date(
    date.toLocaleString("en-US", { timeZone: TIMEZONE })
  );
  const day = parisDate.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Lundi = début de semaine

  const monday = new Date(parisDate);
  monday.setDate(parisDate.getDate() + diff);

  return getStartOfDayParis(monday);
}

/**
 * Calcule la fin de la semaine (dimanche 23h59) en heure de Paris
 * @param date Date de référence
 * @returns Date de la fin de la semaine
 */
export function getEndOfWeekParis(date: Date): Date {
  const startOfWeek = getStartOfWeekParis(date);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return getEndOfDayParis(endOfWeek);
}

/**
 * Calcule le début du mois (1er jour 00h00) en heure de Paris
 * @param date Date de référence
 * @returns Date du début du mois
 */
export function getStartOfMonthParis(date: Date): Date {
  const parisDate = new Date(
    date.toLocaleString("en-US", { timeZone: TIMEZONE })
  );
  const firstDay = new Date(parisDate.getFullYear(), parisDate.getMonth(), 1);

  return getStartOfDayParis(firstDay);
}

/**
 * Calcule la fin du mois (dernier jour 23h59) en heure de Paris
 * @param date Date de référence
 * @returns Date de la fin du mois
 */
export function getEndOfMonthParis(date: Date): Date {
  const parisDate = new Date(
    date.toLocaleString("en-US", { timeZone: TIMEZONE })
  );
  const lastDay = new Date(
    parisDate.getFullYear(),
    parisDate.getMonth() + 1,
    0
  );

  return getEndOfDayParis(lastDay);
}

/**
 * Calcule le début de l'année (1er janvier 00h00) en heure de Paris
 * @param date Date de référence
 * @returns Date du début de l'année
 */
export function getStartOfYearParis(date: Date): Date {
  const parisDate = new Date(
    date.toLocaleString("en-US", { timeZone: TIMEZONE })
  );
  const firstDay = new Date(parisDate.getFullYear(), 0, 1);

  return getStartOfDayParis(firstDay);
}

/**
 * Calcule la fin de l'année (31 décembre 23h59) en heure de Paris
 * @param date Date de référence
 * @returns Date de la fin de l'année
 */
export function getEndOfYearParis(date: Date): Date {
  const parisDate = new Date(
    date.toLocaleString("en-US", { timeZone: TIMEZONE })
  );
  const lastDay = new Date(parisDate.getFullYear(), 11, 31);

  return getEndOfDayParis(lastDay);
}

/**
 * Fonctions pour votre cas d'usage spécifique
 */

/**
 * Obtient les bornes d'une journée donnée en heure de Paris
 * @param date Date de référence
 * @returns Objet avec start et end de la journée
 */
export function getDayBoundsParis(date: Date) {
  return {
    start: getStartOfDayParis(date),
    end: getEndOfDayParis(date),
  };
}

/**
 * Obtient les bornes pour hier en heure de Paris
 * @param referenceDate Date de référence (par défaut: maintenant)
 * @returns Objet avec start et end d'hier
 */
export function getYesterdayBoundsParis(referenceDate: Date = new Date()) {
  const yesterday = new Date(referenceDate);
  yesterday.setDate(yesterday.getDate() - 1);

  return getDayBoundsParis(yesterday);
}

/**
 * Obtient les bornes pour avant-hier en heure de Paris
 * @param referenceDate Date de référence (par défaut: maintenant)
 * @returns Objet avec start et end d'avant-hier
 */
export function getBeforeYesterdayBoundsParis(
  referenceDate: Date = new Date()
) {
  const beforeYesterday = new Date(referenceDate);
  beforeYesterday.setDate(beforeYesterday.getDate() - 2);

  return getDayBoundsParis(beforeYesterday);
}

/**
 * Obtient les heures d'une journée en heure de Paris
 * @param date Date de référence
 * @returns Tableau d'heures de la journée
 */
export function getHoursOfDay(date: Date) {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    hours.push(new Date(date.getTime() + i * 60 * 60 * 1000));
  }
  return hours;
}

export function getParisTimezoneOffset(date: Date) {
  const parisDate = new Date(
    date.toLocaleString("en-US", { timeZone: TIMEZONE })
  );
  const offset = parisDate.getTimezoneOffset();
  return offset;
}

// Fonctions de compatibilité avec votre code existant
export const getStartOfDay = getStartOfDayParis;
export const getEndOfDay = getEndOfDayParis;
export const getStartOfWeek = getStartOfWeekParis;
export const getEndOfWeek = getEndOfWeekParis;
export const getStartOfMonth = getStartOfMonthParis;
export const getEndOfMonth = getEndOfMonthParis;
export const getStartOfYear = getStartOfYearParis;
export const getEndOfYear = getEndOfYearParis;
