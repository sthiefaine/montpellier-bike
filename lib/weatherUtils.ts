// Codes météo Open-Meteo (WMO)
export const WEATHER_CODES = {
  CLEAR: 0,
  MOSTLY_CLEAR: 1,
  PARTLY_CLOUDY: 2,
  OVERCAST: 3,
  FOG: 45,
  RIMING_FOG: 48,
  LIGHT_DRIZZLE: 51,
  MODERATE_DRIZZLE: 53,
  DENSE_DRIZZLE: 55,
  LIGHT_FREEZING_DRIZZLE: 56,
  DENSE_FREEZING_DRIZZLE: 57,
  LIGHT_RAIN: 61,
  MODERATE_RAIN: 63,
  HEAVY_RAIN: 65,
  LIGHT_FREEZING_RAIN: 66,
  HEAVY_FREEZING_RAIN: 67,
  LIGHT_SNOW: 71,
  MODERATE_SNOW: 73,
  HEAVY_SNOW: 75,
  SNOW_GRAINS: 77,
  LIGHT_SHOWERS: 80,
  MODERATE_SHOWERS: 81,
  VIOLENT_SHOWERS: 82,
  LIGHT_SNOW_SHOWERS: 85,
  HEAVY_SNOW_SHOWERS: 86,
  THUNDERSTORM: 95,
  THUNDERSTORM_HAIL: 96,
  THUNDERSTORM_HEAVY_HAIL: 99
} as const;

// Fonction pour déterminer si il pleut basée sur le code météo Open-Meteo
export function isRaining(weatherCode: number): boolean {
  const rainCodes = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
  return rainCodes.includes(weatherCode);
}

// Fonction pour déterminer si il fait nuageux basée sur le code météo Open-Meteo
export function isCloudy(weatherCode: number): boolean {
  const cloudyCodes = [1, 2, 3];
  return cloudyCodes.includes(weatherCode);
}

// Fonction pour obtenir la description météo Open-Meteo
export function getWeatherDescription(weatherCode: number): string {
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
    99: "Orage avec grêle forte"
  };
  
  return descriptions[weatherCode] || "Conditions météo inconnues";
}

// Fonction pour obtenir l'icône météo Open-Meteo
export function getWeatherIcon(weatherCode: number): string {
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
    99: "⛈️"
  };
  
  return icons[weatherCode] || "🌤️";
}

// Fonction pour obtenir la couleur de l'icône météo
export function getWeatherIconColor(weatherCode: number): string {
  if (isRaining(weatherCode)) {
    return "text-blue-600";
  }
  if (isCloudy(weatherCode)) {
    return "text-gray-600";
  }
  return "text-yellow-600";
} 