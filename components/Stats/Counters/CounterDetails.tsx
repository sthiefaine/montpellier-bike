"use client";

import type { BikeCounter } from "@prisma/client";
import CounterSkeleton from "@/components/Stats/Counters/CounterSkeleton";
import { CounterStats } from "@/types/counters/counters";
import Link from "next/link";

interface CounterDetailsProps {
  counter: BikeCounter | null;
  counterStats: CounterStats | null;
}

export default function CounterDetails({
  counter,
  counterStats,
}: CounterDetailsProps) {
  const stats = counterStats;

  if (!counter || !stats) return <CounterSkeleton />;

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/Paris",
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
      timeZone: "Europe/Paris",
    });
  };

  return (
    <div className="space-y-1 min-h-[260px] flex flex-col justify-between">
      <h3 className="text-lg font-semibold text-gray-900">
        Informations générales
      </h3>
      <div className="flex-1 flex flex-col gap-2">
        <div className="bg-green-50 p-1 rounded-lg min-h-[60px]">
          <p className="text-sm font-medium text-green-900 mb-1">
            Nom du compteur
          </p>
          <p className="text-xs font-semibold text-green-700 first-letter:uppercase">
            {counter.name}
          </p>
        </div>
        <div className="bg-orange-50 p-1 rounded-lg min-h-[60px]">
          <p className="text-sm font-medium text-orange-900 mb-1">
            Premier passage
          </p>
          <p className="text-sm font-semibold text-orange-700 first-letter:uppercase">
            {formatDate(stats.firstPassageDate)}
          </p>
        </div>
        <div className="bg-indigo-50 p-1 rounded-lg min-h-[60px]">
          <p className="text-sm font-medium text-indigo-900 mb-1">
            Dernier passage
          </p>
          <p className="text-sm font-semibold text-indigo-700 first-letter:uppercase">
            {formatDateTime(stats.lastPassageDate)}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 mt-4">
        <Link
          href={`/counters/${counter.serialNumber}`}
          className="w-full max-w-xs inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-700 text-white font-semibold rounded-lg shadow hover:from-indigo-600 hover:to-indigo-800 transition-all duration-200"
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
          <span className="text-sm font-medium">Voir</span>
        </Link>
        <p className="text-xs text-center text-gray-600 mt-1">
          Afficher les détails
        </p>
      </div>
    </div>
  );
}
