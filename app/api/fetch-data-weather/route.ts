import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultCenters } from "@/lib/defaultCenters";

type WeatherRecord = {
  zone: string;
  lat: number;
  lng: number;
  source: string;
  timezone: string | null;
  utcOffsetSeconds: number | null;
  date: Date;
  type: "hourly" | "daily";
  temperature2m?: number | null;
  rain?: number | null;
  weatherCode?: number | null;
  windSpeed100m?: number | null;
  windDirection100m?: number | null;
  windDirection10m?: number | null;
  windSpeed10m?: number | null;
  windGusts10m?: number | null;
  isDay?: number | null;
  precipitation?: number | null;
  apparentTemperature?: number | null;
  snowfall?: number | null;
  dewPoint2m?: number | null;
  relativeHumidity2m?: number | null;
  cloudCover?: number | null;
  daylightDuration?: number | null;
  sunshineDuration?: number | null;
  sunrise?: Date | null;
  sunset?: Date | null;
  temperature2mMax?: number | null;
  temperature2mMin?: number | null;
  precipitationSum?: number | null;
  rainSum?: number | null;
  snowfallSum?: number | null;
  precipitationHours?: number | null;
  windSpeed10mMax?: number | null;
  windGusts10mMax?: number | null;
  windDirection10mDominant?: number | null;
  precipitationProbabilityMax?: number | null;
  precipitationProbabilityMin?: number | null;
  precipitationProbabilityMean?: number | null;
};

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getYesterdayStart() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  return yesterday.toISOString();
}

function getTodayEnd() {
  const now = new Date();
  const today = new Date(now);
  today.setHours(23, 59, 59, 999);
  return today.toISOString();
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

const DAILY = [
  "daylight_duration",
  "sunshine_duration",
  "sunrise",
  "sunset",
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_sum",
  "rain_sum",
  "snowfall_sum",
  "precipitation_hours",
  "wind_speed_10m_max",
  "wind_gusts_10m_max",
  "wind_direction_10m_dominant",
  "weather_code",
  "sunrise",
  "sunset",
  "daylight_duration",
  "sunshine_duration",
  "precipitation_probability_max",
  "precipitation_probability_min",
  "precipitation_probability_mean",
];

function getApiUrl(lat: number, lng: number, from: Date, to: Date) {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    start_date: toISODate(from),
    end_date: toISODate(to),
    timezone: "Europe/Berlin",
    hourly: HOURLY.join(","),
    daily: DAILY.join(","),
  });

  const beforeYesterday = new Date();
  beforeYesterday.setDate(beforeYesterday.getDate() - 2);
  beforeYesterday.setHours(0, 0, 0, 0);

  const baseUrl =
    from < beforeYesterday
      ? "https://archive-api.open-meteo.com/v1/archive"
      : "https://api.open-meteo.com/v1/forecast";

  return `${baseUrl}?${params.toString()}`;
}

async function fetchWeather(lat: number, lng: number, from: Date, to: Date) {
  const url = getApiUrl(lat, lng, from, to);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(
      "[fetchWeather] Erreur API météo",
      res.status,
      await res.text()
    );
    throw new Error("Erreur API météo");
  }
  return res.json();
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

    try {
      const result = await prisma.$transaction(
        hourlyRecords.map((record: WeatherRecord) =>
          prisma.weatherTimeseries.upsert({
            where: {
              zone_date_type: {
                zone: record.zone,
                date: record.date,
                type: record.type,
              },
            },
            update: {
              temperature2m: record.temperature2m,
              rain: record.rain,
              weatherCode: record.weatherCode,
              windSpeed100m: record.windSpeed100m,
              windDirection100m: record.windDirection100m,
              windDirection10m: record.windDirection10m,
              windSpeed10m: record.windSpeed10m,
              windGusts10m: record.windGusts10m,
              isDay: record.isDay,
              precipitation: record.precipitation,
              apparentTemperature: record.apparentTemperature,
              snowfall: record.snowfall,
              dewPoint2m: record.dewPoint2m,
              relativeHumidity2m: record.relativeHumidity2m,
              cloudCover: record.cloudCover,
            },
            create: record,
          })
        )
      );
      totalInserted += result.length;
    } catch (error) {
      console.error(
        "[storeWeatherData] Erreur lors de l'insertion des données horaires:",
        error
      );
      throw error;
    }
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
      sunrise: data.daily.sunrise?.[i] ? new Date(data.daily.sunrise[i]) : null,
      sunset: data.daily.sunset?.[i] ? new Date(data.daily.sunset[i]) : null,
      temperature2mMax: data.daily.temperature_2m_max?.[i],
      temperature2mMin: data.daily.temperature_2m_min?.[i],
      precipitationSum: data.daily.precipitation_sum?.[i],
      rainSum: data.daily.rain_sum?.[i],
      snowfallSum: data.daily.snowfall_sum?.[i],
      precipitationHours: data.daily.precipitation_hours?.[i],
      windSpeed10mMax: data.daily.wind_speed_10m_max?.[i],
      windGusts10mMax: data.daily.wind_gusts_10m_max?.[i],
      windDirection10mDominant: data.daily.wind_direction_10m_dominant?.[i],
      precipitationProbabilityMax:
        data.daily.precipitation_probability_max?.[i],
      precipitationProbabilityMin:
        data.daily.precipitation_probability_min?.[i],
      precipitationProbabilityMean:
        data.daily.precipitation_probability_mean?.[i],
    }));

    try {
      const result = await prisma.$transaction(
        dailyRecords.map((record: WeatherRecord) =>
          prisma.weatherTimeseries.upsert({
            where: {
              zone_date_type: {
                zone: record.zone,
                date: record.date,
                type: record.type,
              },
            },
            update: {
              daylightDuration: record.daylightDuration,
              sunshineDuration: record.sunshineDuration,
              sunrise: record.sunrise,
              sunset: record.sunset,
              temperature2mMax: record.temperature2mMax,
              temperature2mMin: record.temperature2mMin,
              precipitationSum: record.precipitationSum,
              rainSum: record.rainSum,
              snowfallSum: record.snowfallSum,
              precipitationHours: record.precipitationHours,
              windSpeed10mMax: record.windSpeed10mMax,
              windGusts10mMax: record.windGusts10mMax,
              windDirection10mDominant: record.windDirection10mDominant,
              precipitationProbabilityMax: record.precipitationProbabilityMax,
              precipitationProbabilityMin: record.precipitationProbabilityMin,
              precipitationProbabilityMean: record.precipitationProbabilityMean,
            },
            create: record,
          })
        )
      );
      totalInserted += result.length;
    } catch (error) {
      console.error(
        "[storeWeatherData] Erreur lors de l'insertion des données quotidiennes:",
        error
      );
      throw error;
    }
  }

  return totalInserted;
}

export async function GET() {
  try {
    const from = getYesterdayStart();
    const to = getTodayEnd();
    let totalInserted = 0;

    for (const [zone, center] of Object.entries(defaultCenters)) {
      const data = await fetchWeather(
        center.lat,
        center.lng,
        new Date(from),
        new Date(to)
      );
      totalInserted += await storeWeatherData(zone, center, data);
    }

    return NextResponse.json({ ok: true, totalInserted });
  } catch (e: any) {
    console.error("[fetch-data-weather] Erreur:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
