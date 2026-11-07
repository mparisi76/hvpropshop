import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "HV Prop Shop | Prop & set dressing rentals, Hudson Valley to NYC",
  description:
    "Rent props and set dressing from independent vendors across the Hudson Valley and New York City.",
};

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} style={{ colorScheme: "light" }}>
      <body className="font-sans antialiased flex flex-col min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
