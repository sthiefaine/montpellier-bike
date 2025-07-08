"use server";

import { prisma } from "@/lib/prisma";

// Coordonnées de Montpellier
const MONTPELLIER_LAT = 43.6108;
const MONTPELLIER_LNG = 3.8767;

interface WeatherData {
  temperature: number;
  weatherCode: number;
  isRaining: boolean;
  isCloudy: boolean;
  humidity?: number;
  windSpeed?: number;
  precipitation?: number;
}

// Fonction pour déterminer si il pleut basée sur le code météo Open-Meteo
function isRaining(weatherCode: number): boolean {
  // Codes météo pour la pluie (selon Open-Meteo WMO)
  const rainCodes = [
    51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86,
    95, 96, 99,
  ];
  return rainCodes.includes(weatherCode);
}

// Fonction pour déterminer si il fait nuageux basée sur le code météo Open-Meteo
function isCloudy(weatherCode: number): boolean {
  // Codes météo pour les nuages (selon Open-Meteo WMO)
  const cloudyCodes = [1, 2, 3];
  return cloudyCodes.includes(weatherCode);
}

// Fonction pour obtenir la description météo Open-Meteo
function getWeatherDescription(weatherCode: number): string {
  const descriptions: { [key: number]: string } = {
    0: "Ciel dégagé",
    1: "Peu nuageux",
    2: "Partiellement nuageux",
    3: "Couvert",
    45: "Brouillard",
    48: "Brouillard givrant",
    51: "Bruine légère",
    53: "Bruine modérée",
    55: "Bruine dense",
    56: "Bruine verglaçante légère",
    57: "Bruine verglaçante dense",
    61: "Pluie légère",
    63: "Pluie modérée",
    65: "Pluie forte",
    66: "Pluie verglaçante légère",
    67: "Pluie verglaçante forte",
    71: "Neige légère",
    73: "Neige modérée",
    75: "Neige forte",
    77: "Grains de neige",
    80: "Averses légères",
    81: "Averses modérées",
    82: "Averses violentes",
    85: "Averses de neige légères",
    86: "Averses de neige fortes",
    95: "Orage",
    96: "Orage avec grêle légère",
    99: "Orage avec grêle forte",
  };

  return descriptions[weatherCode] || "Conditions météo inconnues";
}

// Fonction pour obtenir l'icône météo Open-Meteo
function getWeatherIcon(weatherCode: number): string {
  const icons: { [key: number]: string } = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    53: "🌦️",
    55: "🌦️",
    56: "🌨️",
    57: "🌨️",
    61: "🌧️",
    63: "🌧️",
    65: "🌧️",
    66: "🌨️",
    67: "🌨️",
    71: "🌨️",
    73: "🌨️",
    75: "🌨️",
    77: "🌨️",
    80: "🌧️",
    81: "🌧️",
    82: "🌧️",
    85: "🌨️",
    86: "🌨️",
    95: "⛈️",
    96: "⛈️",
    99: "⛈️",
  };

  return icons[weatherCode] || "🌤️";
}

export async function fetchAndStoreWeather() {
  try {
    console.log("Début de la récupération de la météo pour Montpellier...");

    // Utiliser l'API Open-Meteo (gratuite, pas de clé API nécessaire)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${MONTPELLIER_LAT}&longitude=${MONTPELLIER_LNG}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover&timezone=Europe/Paris`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur API météo: ${response.status}`);
    }

    const data = await response.json();

    // Extraire les données météo actuelles
    const current = data.current;

    // Convertir le code météo Open-Meteo vers notre format
    const weatherCode = current.weather_code;

    // Extraire les données météo
    const weatherData: WeatherData = {
      temperature: current.temperature_2m,
      weatherCode: weatherCode,
      isRaining: isRaining(weatherCode),
      isCloudy: isCloudy(weatherCode),
      humidity: current.relative_humidity_2m,
      windSpeed: undefined, // Pas disponible dans la réponse actuelle
      precipitation: current.precipitation,
    };

    // Date d'aujourd'hui (début de journée)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Vérifier si on a déjà des données pour aujourd'hui
    const existingWeather = await prisma.dailyWeather.findUnique({
      where: { date: today },
    });

    if (existingWeather) {
      // Mettre à jour les données existantes
      await prisma.dailyWeather.update({
        where: { date: today },
        data: weatherData,
      });
      console.log("Météo mise à jour pour aujourd'hui");
    } else {
      // Créer de nouvelles données
      await prisma.dailyWeather.create({
        data: {
          date: today,
          ...weatherData,
        },
      });
      console.log("Nouvelles données météo créées pour aujourd'hui");
    }

    return weatherData;
  } catch (error) {
    console.error("Erreur lors de la récupération de la météo:", error);
    throw error;
  }
}

export async function getTodayWeather() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weather = await prisma.dailyWeather.findUnique({
      where: { date: today },
    });

    return weather;
  } catch (error) {
    console.error("Erreur lors de la récupération de la météo du jour:", error);
    return null;
  }
}

export async function getWeatherForDate(date: Date) {
  try {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const weather = await prisma.dailyWeather.findUnique({
      where: { date: targetDate },
    });

    return weather;
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la météo pour la date:",
      error
    );
    return null;
  }
}
