export const maxDuration = 300;
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultCenters } from "@/app/components/MapLibre";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
function subMonths(date: Date, n: number) {
  return new Date(
    date.getFullYear(),
    date.getMonth() - n,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
    date.getMilliseconds()
  );
}
function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

const HOURLY = [
  "temperature_2m",
  "rain",
  "weather_code",
  "wind_speed_100m",
  "wind_direction_100m",
  "wind_direction_10m",
  "wind_speed_10m",
  "wind_gusts_10m",
  "is_day",
  "precipitation",
  "apparent_temperature",
  "snowfall",
  "dew_point_2m",
  "relative_humidity_2m",
  "cloud_cover",
];
const DAILY = ["daylight_duration", "sunshine_duration", "sunrise", "sunset"];

async function fetchWeather(lat: number, lng: number, from: Date, to: Date) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    start_date: toISODate(from),
    end_date: toISODate(to),
    timezone: "Europe/Berlin",
    hourly: HOURLY.join(","),
    daily: DAILY.join(","),
  });
  const url = `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;
  console.log("[fetchWeather] URL:", url);
  const res = await fetch(url);
  if (!res.ok) {
    console.error("[fetchWeather] Erreur API météo", res.status, await res.text());
    throw new Error("Erreur API météo");
  }
  const json = await res.json();
  console.log("[fetchWeather] Réponse API:", JSON.stringify(json).slice(0, 500));
  return json;
}

export async function GET() {
  try {
    console.log("[fetch-weather] DÉBUT JOB");
    let totalInserted = 0;
    const now = subMonths(new Date(), 1);
    console.log("[fetch-weather] defaultCenters:", Object.keys(defaultCenters));
    Object.entries(defaultCenters).forEach(async ([zone, center]) => {
      console.log(`[fetch-weather] zone: ${zone}, lat: ${center.lat}, lng: ${center.lng}`);
      let month = 0;
      let done = false;
      console.log(`[fetch-weather] Début boucle mois pour la zone: ${zone}`);
      while (!done && month < 12) {
        const from = startOfMonth(subMonths(now, month));
        const to = endOfMonth(subMonths(now, month));
        console.log(`[${zone}] Mois:`, from.toISOString(), "->", to.toISOString());
        const count = await prisma.weatherTimeseries.count({
          where: {
            zone,
            type: "hourly",
            date: { gte: from, lte: to },
          },
        });
        console.log(`[${zone}] Données déjà présentes:`, count);
        if (count >= 24 * 28) {
          console.log(`[${zone}] Mois déjà rempli, on passe au précédent.`);
          month++;
          continue;
        }
        const data = await fetchWeather(center.lat, center.lng, from, to);
        const source = "open-meteo";
        const timezone = data.timezone || null;
        const utcOffsetSeconds = data.utc_offset_seconds || null;
        if (data.hourly && data.hourly.time) {
          for (let i = 0; i < data.hourly.time.length; i++) {
            const date = new Date(data.hourly.time[i]);
            await prisma.weatherTimeseries.upsert({
              where: { zone_date_type: { zone, date, type: "hourly" } },
              update: {
                lat: center.lat,
                lng: center.lng,
                source,
                timezone,
                utcOffsetSeconds,
                temperature2m: data.hourly.temperature_2m?.[i],
                rain: data.hourly.rain?.[i],
                weatherCode: data.hourly.weather_code?.[i],
                windSpeed100m: data.hourly.wind_speed_100m?.[i],
                windDirection100m: data.hourly.wind_direction_100m?.[i],
                windDirection10m: data.hourly.wind_direction_10m?.[i],
                windSpeed10m: data.hourly.wind_speed_10m?.[i],
                windGusts10m: data.hourly.wind_gusts_10m?.[i],
                isDay: data.hourly.is_day?.[i],
                precipitation: data.hourly.precipitation?.[i],
                apparentTemperature: data.hourly.apparent_temperature?.[i],
                snowfall: data.hourly.snowfall?.[i],
                dewPoint2m: data.hourly.dew_point_2m?.[i],
                relativeHumidity2m: data.hourly.relative_humidity_2m?.[i],
                cloudCover: data.hourly.cloud_cover?.[i],
              },
              create: {
                zone,
                lat: center.lat,
                lng: center.lng,
                source,
                timezone,
                utcOffsetSeconds,
                date,
                type: "hourly",
                temperature2m: data.hourly.temperature_2m?.[i],
                rain: data.hourly.rain?.[i],
                weatherCode: data.hourly.weather_code?.[i],
                windSpeed100m: data.hourly.wind_speed_100m?.[i],
                windDirection100m: data.hourly.wind_direction_100m?.[i],
                windDirection10m: data.hourly.wind_direction_10m?.[i],
                windSpeed10m: data.hourly.wind_speed_10m?.[i],
                windGusts10m: data.hourly.wind_gusts_10m?.[i],
                isDay: data.hourly.is_day?.[i],
                precipitation: data.hourly.precipitation?.[i],
                apparentTemperature: data.hourly.apparent_temperature?.[i],
                snowfall: data.hourly.snowfall?.[i],
                dewPoint2m: data.hourly.dew_point_2m?.[i],
                relativeHumidity2m: data.hourly.relative_humidity_2m?.[i],
                cloudCover: data.hourly.cloud_cover?.[i],
              },
            });
            totalInserted++;
          }
        } else {
          console.log(`[${zone}] Pas de données horaires reçues pour ce mois.`);
        }
        if (data.daily && data.daily.time) {
          for (let i = 0; i < data.daily.time.length; i++) {
            const date = new Date(data.daily.time[i]);
            await prisma.weatherTimeseries.upsert({
              where: { zone_date_type: { zone, date, type: "daily" } },
              update: {
                lat: center.lat,
                lng: center.lng,
                source,
                timezone,
                utcOffsetSeconds,
                daylightDuration: data.daily.daylight_duration?.[i],
                sunshineDuration: data.daily.sunshine_duration?.[i],
                sunrise: data.daily.sunrise?.[i]
                  ? new Date(data.daily.sunrise[i])
                  : undefined,
                sunset: data.daily.sunset?.[i]
                  ? new Date(data.daily.sunset[i])
                  : undefined,
              },
              create: {
                zone,
                lat: center.lat,
                lng: center.lng,
                source,
                timezone,
                utcOffsetSeconds,
                date,
                type: "daily",
                daylightDuration: data.daily.daylight_duration?.[i],
                sunshineDuration: data.daily.sunshine_duration?.[i],
                sunrise: data.daily.sunrise?.[i]
                  ? new Date(data.daily.sunrise[i])
                  : undefined,
                sunset: data.daily.sunset?.[i]
                  ? new Date(data.daily.sunset[i])
                  : undefined,
              },
            });
            totalInserted++;
          }
        } else {
          console.log(`[${zone}] Pas de données daily reçues pour ce mois.`);
        }
        done = true;
      }
    });
    console.log("[fetch-weather] totalInserted:", totalInserted);
    return NextResponse.json({ ok: true, totalInserted });
  } catch (e: any) {
    console.error("[fetch-weather] Erreur:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
