'use client';

import type { BikeCounter } from "@prisma/client";
import { useEffect, useState } from "react";
import { getCounterStats } from "@/app/actions/counters";

interface CounterDetailsProps {
  counter: BikeCounter | null;
}

interface CounterStats {
  yesterday: number;
  today: number;
  firstPassageDate: Date | null;
  lastPassageDate: Date | null;
  lastPassageYesterday: Date | null;
  lastPassageToday: Date | null;
}

export default function CounterDetails({ counter }: CounterDetailsProps) {
  const [stats, setStats] = useState<CounterStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      if (!counter) {
        setStats(null);
        return;
      }

      setIsLoading(true);
      try {
        const stats = await getCounterStats(counter.id);
        setStats(stats);
      } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [counter]);

  if (!counter) {
    return (
      <div className="p-6 bg-white rounded-xl shadow-lg h-full">
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500 text-lg">Sélectionnez un compteur sur la carte pour voir ses détails</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg h-full">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">{counter.name}</h2>
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600"><span className="font-semibold text-gray-800">Numéro de série :</span> {counter.serialNumber}</p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-800">Premier passage :</span>{" "}
            {stats?.firstPassageDate 
              ? new Date(stats.firstPassageDate).toLocaleDateString()
              : "Aucune donnée"}
          </p>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-800">Dernier passage :</span>{" "}
            {stats?.lastPassageDate 
              ? new Date(stats.lastPassageDate).toLocaleString('fr-FR', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })
              : "Aucune donnée"}
          </p>
        </div>

        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-gray-800">Statistiques</h3>
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : stats ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">
                  <span className="font-semibold">Hier :</span> {stats.yesterday.toLocaleString()} passages
                  {stats.lastPassageYesterday && (
                    <span className="block text-sm mt-1">
                      Dernier passage : {new Date(stats.lastPassageYesterday).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-green-800">
                  <span className="font-semibold">Aujourd'hui :</span> {stats.today.toLocaleString()} passages
                  {stats.lastPassageToday && (
                    <span className="block text-sm mt-1">
                      Dernier passage : {new Date(stats.lastPassageToday).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Aucune donnée disponible</p>
          )}
        </div>
      </div>
    </div>
  );
} 