import { getGlobalDailyStatsForYear } from "@/actions/counters/daily";
import CounterGlobalDailyChart from "@/components/Stats/Counters/CounterGlobalDailyChart";
export default async function GeneralPage() {
  const currentYear = new Date().getFullYear().toString();
  const globalDailyStats = await getGlobalDailyStatsForYear();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Statistiques Globales</h1>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-lg shadow p-4 h-[calc(60vh)]">
          <CounterGlobalDailyChart
            counterGlobalDailyStats={globalDailyStats}
            currentYear={currentYear}
          />
        </div>
      </div>
    </div>
  );
}
