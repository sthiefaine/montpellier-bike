import { BikeCounter } from "@prisma/client";
import Link from "next/link";

interface CounterDetailsHeaderProps {
  counter: BikeCounter;
  isActive: boolean;
}

export default function CounterDetailsHeader({ counter, isActive }: CounterDetailsHeaderProps) {
  const serialNumber = counter.serialNumber1 && /^[a-zA-Z]/.test(counter.serialNumber1)
    ? counter.serialNumber1
    : counter.serialNumber;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {counter.name}
            </h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isActive 
                ? "bg-green-100 text-green-800" 
                : "bg-red-100 text-red-800"
            }`}>
              {isActive ? "Actif" : "Inactif"}
            </span>
          </div>
          <p className="text-gray-600">
            Numéro de série : {serialNumber}
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-200"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" 
              clipRule="evenodd" 
            />
          </svg>
          Retour à la carte
        </Link>
      </div>
    </div>
  );
} 