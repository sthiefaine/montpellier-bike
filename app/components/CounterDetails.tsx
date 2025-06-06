"use client";

import type { BikeCounter } from "@prisma/client";
import CounterSkeleton from "./CounterSkeleton";
import { PreloadedCounterData } from "../page";
import Link from "next/link";

interface CounterDetailsProps {
  counter: BikeCounter | null;
  preloadedData: PreloadedCounterData | null;
}

export default function CounterDetails({
  counter,
  preloadedData,
}: CounterDetailsProps) {
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
        <p className="text-xs font-semibold text-green-700 first-letter:uppercase">
          {counter.name}
        </p>
      </div>

      <div className="bg-orange-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-orange-900 mb-1">
          Premier passage
        </p>
        <p className="text-sm font-semibold text-orange-700 first-letter:uppercase">
          {formatDate(stats.firstPassageDate)}
        </p>
      </div>
      <div className="bg-indigo-50 p-1 rounded-lg h-[60px]">
        <p className="text-sm font-medium text-indigo-900 mb-1">
          Dernier passage
        </p>
        <p className="text-sm font-semibold text-indigo-700 first-letter:uppercase">
          {formatDateTime(stats.lastPassageDate)}
        </p>
      </div>
      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-3 rounded-lg h-[60px] transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
        <Link
          href={`./counter/${counter.id}`}
          className="block h-full w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200 flex flex-col items-center justify-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs font-medium">Afficher les détails</span>
        </Link>
      </div>
    </div>
  );
}
