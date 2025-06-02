import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultCenters } from "@/lib/defaultCenters";

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // lundi = 1
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), diff, 0, 0, 0, 0));
}
function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000 + 59 * 60 * 1000 + 59 * 1000 + 999); // dimanche 23:59:59.999
}
function subWeeks(date: Date, n: number) {
  return new Date(date.getTime() - n * 7 * 24 * 60 * 60 * 1000);
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

async function storeWeatherData(zone: string, center: { lat: number; lng: number }, data: any) {
  const source = "open-meteo";
  const timezone = data.timezone || null;
  const utcOffsetSeconds = data.utc_offset_seconds || null;
  let totalInserted = 0;

  if (data.hourly && data.hourly.time) {
    const hourlyRecords = data.hourly.time.map((time: string, i: number) => ({
      zone,
      lat: center.lat,
      lng: center.lng,
      source,
      timezone,
      utcOffsetSeconds,
      date: new Date(time),
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
    }));

    const result = await prisma.weatherTimeseries.createMany({
      data: hourlyRecords,
      skipDuplicates: true,
    });
    totalInserted += result.count;
  }

  if (data.daily && data.daily.time) {
    const dailyRecords = data.daily.time.map((time: string, i: number) => ({
      zone,
      lat: center.lat,
      lng: center.lng,
      source,
      timezone,
      utcOffsetSeconds,
      date: new Date(time),
      type: "daily",
      daylightDuration: data.daily.daylight_duration?.[i],
      sunshineDuration: data.daily.sunshine_duration?.[i],
      sunrise: data.daily.sunrise?.[i] ? new Date(data.daily.sunrise[i]) : undefined,
      sunset: data.daily.sunset?.[i] ? new Date(data.daily.sunset[i]) : undefined,
    }));

    const result = await prisma.weatherTimeseries.createMany({
      data: dailyRecords,
      skipDuplicates: true,
    });
    totalInserted += result.count;
  }

  return totalInserted;
}

// /api/fetch-weather?from=2022-11-01T00:00:00.000Z&to=2025-06-02T00:00:00.000Z
export async function GET(req: NextRequest) {
  try {
    console.log("[fetch-weather] DÉBUT JOB");
    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    if (!fromParam || !toParam) {
      return NextResponse.json({ ok: false, error: 'from et to params requis' }, { status: 400 });
    }

    const from = new Date(fromParam);
    const to = new Date(toParam);
    let totalInserted = 0;

    for (const [zone, center] of Object.entries(defaultCenters)) {
      console.log(`[fetch-weather] zone: ${zone}, lat: ${center.lat}, lng: ${center.lng}`);
      console.log(`[${zone}] Période à traiter:`, from.toISOString(), "->", to.toISOString());

      const data = await fetchWeather(center.lat, center.lng, from, to);
      totalInserted += await storeWeatherData(zone, center, data);
    }

    console.log("[fetch-weather] totalInserted:", totalInserted);
    return NextResponse.json({ ok: true, totalInserted });
  } catch (e: any) {
    console.error("[fetch-weather] Erreur:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
