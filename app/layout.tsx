import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vélos Montpellier | Compteurs de passages",
  description: "Suivez en temps réel le nombre de passages de vélos sur les pistes cyclables de Montpellier et ses alentours",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`antialiased`}>
        {/* Navigation Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo et titre */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🌱</span>
                </div>
                <h1 className="text-lg font-bold text-gray-900">ECO compteur Montpellier</h1>
              </div>

              {/* Navigation */}
              <nav className="hidden md:flex items-center gap-6">
                <Link
                  href="/" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
                >
                  Accueil
                </Link>
                <Link
                  href="/general" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
                >
                  Stats
                </Link>
                <Link
                  href="/counters" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
                >
                  Liste
                </Link>
                <Link
                  href="/monitoring" 
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
                >
                  Monitoring
                </Link>
              </nav>

              {/* Mobile menu button */}
              <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
