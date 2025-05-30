import { BikeCounter } from "@prisma/client";

type HeroSectionProps = {
  counters: BikeCounter[];
};

export default function HeroSection({ counters }: HeroSectionProps) {
  const totalCounters = counters.length;

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-blue-50 to-white z-10">
      <div className="container mx-auto px-4 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-gray-900">
              Compteurs de vélos à Montpellier
            </h1>
            <p className="text-xl text-gray-600">
              Suivez en temps réel le nombre de cyclistes qui empruntent les
              pistes cyclables de Montpellier. Une vue d'ensemble de la mobilité
              douce dans notre ville.
            </p>
            <button className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-colors">
              Voir les compteurs
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
