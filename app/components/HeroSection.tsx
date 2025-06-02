import { getGlobalStats } from "@/app/actions/counters";
import NumberFlow from "@/app/components/NumberFlow";

export default async function HeroSection() {
  const stats = await getGlobalStats();

  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            <NumberFlow value={stats.totalCounters} /> points de comptage à Montpellier
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Suivez la mobilité douce dans les rues de Montpellier et les alentours, déjà{" "}
            <NumberFlow value={stats.totalPassages} /> passages depuis le{" "}
            {stats.firstPassageDate
              ? new Date(stats.firstPassageDate).toLocaleDateString("fr-FR")
              : "début des mesures"}
          </p>
        </div>
      </div>
    </div>
  );
}
