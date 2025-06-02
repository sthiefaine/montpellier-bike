import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultCenters } from "@/lib/defaultCenters";

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getYesterdayStart() {
  const now = new Date();
  const yesterday = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - 1,
      0,
      0,
      0,
      0
    )
  );
  return yesterday;
}

function getTodayEnd() {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999
    )
  );
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
    console.error(
      "[fetchWeather] Erreur API météo",
      res.status,
      await res.text()
    );
    throw new Error("Erreur API météo");
  }
  const json = await res.json();
  console.log(
    "[fetchWeather] Réponse API:",
    JSON.stringify(json).slice(0, 500)
  );
  return json;
}

async function storeWeatherData(
  zone: string,
  center: { lat: number; lng: number },
  data: any
) {
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
      type: "hourly" as const,
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

    // On utilise une transaction pour faire les upserts en masse
    const result = await prisma.$transaction(
      hourlyRecords.map((record: (typeof hourlyRecords)[0]) =>
        prisma.weatherTimeseries.upsert({
          where: {
            zone_date_type: {
              zone: record.zone,
              date: record.date,
              type: record.type,
            },
          },
          update: record,
          create: record,
        })
      )
    );
    totalInserted += result.length;
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
      type: "daily" as const,
      daylightDuration: data.daily.daylight_duration?.[i],
      sunshineDuration: data.daily.sunshine_duration?.[i],
      sunrise: data.daily.sunrise?.[i]
        ? new Date(data.daily.sunrise[i])
        : undefined,
      sunset: data.daily.sunset?.[i]
        ? new Date(data.daily.sunset[i])
        : undefined,
    }));

    // On utilise une transaction pour faire les upserts en masse
    const result = await prisma.$transaction(
      dailyRecords.map((record: (typeof dailyRecords)[0]) =>
        prisma.weatherTimeseries.upsert({
          where: {
            zone_date_type: {
              zone: record.zone,
              date: record.date,
              type: record.type,
            },
          },
          update: record,
          create: record,
        })
      )
    );
    totalInserted += result.length;
  }

  return totalInserted;
}

export async function GET() {
  try {
    console.log("[fetch-data-weather] DÉBUT JOB");
    const from = getYesterdayStart();
    const to = getTodayEnd();
    let totalInserted = 0;

    for (const [zone, center] of Object.entries(defaultCenters)) {
      console.log(
        `[fetch-data-weather] zone: ${zone}, lat: ${center.lat}, lng: ${center.lng}`
      );
      console.log(
        `[${zone}] Période à traiter:`,
        from.toISOString(),
        "->",
        to.toISOString()
      );

      const data = await fetchWeather(center.lat, center.lng, from, to);
      totalInserted += await storeWeatherData(zone, center, data);
    }

    console.log("[fetch-data-weather] totalInserted:", totalInserted);
    return NextResponse.json({ ok: true, totalInserted });
  } catch (e: any) {
    console.error("[fetch-data-weather] Erreur:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
