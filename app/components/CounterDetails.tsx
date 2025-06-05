"use client";

import { useEffect, useState } from "react";
import type { BikeCounter } from "@prisma/client";
import { getCounterStats } from "@/app/actions/counters";
import CounterSkeleton from "./CounterSkeleton";
import NumberFlow from "./NumberFlow";
import { PreloadedCounterData } from "../page";

interface CounterDetailsProps {
  counter: BikeCounter | null;
  preloadedData: PreloadedCounterData | null;
}

export default function CounterDetails({ counter, preloadedData }: CounterDetailsProps) {
  const stats = preloadedData?.counterStats;

  if (!counter || !stats) return <CounterSkeleton />;

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatDateTime = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-gray-900">
        Informations générales
      </h3>
      <div className="bg-green-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-green-900 mb-1">
          Nom du compteur
        </p>
        <p className="text-xs font-semibold text-green-700 first-letter:uppercase">{counter.name}</p>
      </div>

      <div className="bg-orange-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-orange-900 mb-1">
          Premier passage
        </p>
        <p className="text-base font-semibold text-orange-700 first-letter:uppercase">
          {formatDate(stats.firstPassageDate)}
        </p>
      </div>
      <div className="bg-indigo-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-indigo-900 mb-1">
          Dernier passage
        </p>
        <p className="text-base font-semibold text-indigo-700 first-letter:uppercase">
          {formatDateTime(stats.lastPassageDate)}
        </p>
      </div>
    </div>
  );
}
