import { Inter } from "next/font/google";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_TAGLINE, baseUrl } from "@/lib/seo";
import Analytics from "@/components/Analytics";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl()),
  title: `${SITE_NAME} | ${SITE_TAGLINE}`,
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    title: `${SITE_NAME} | ${SITE_TAGLINE}`,
    description: DEFAULT_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
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
        <Analytics />
      </body>
    </html>
  );
}
