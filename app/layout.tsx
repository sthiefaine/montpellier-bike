import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

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
      <body className={`antialiased pt-16`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
