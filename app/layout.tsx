import type { Metadata } from "next";
import "./globals.css";

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
      <body className={`antialiased`}>{children}</body>
    </html>
  );
}
