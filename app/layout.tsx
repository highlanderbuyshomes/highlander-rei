import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/lib/LanguageContext";
import Script from "next/script";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Highlander REI — Sell, Explore, or Invest in Real Estate",
  description:
    "Sell your home for cash, explore your real estate options, or invest in property flips with Highlander REI in Phoenix, AZ and Dallas, TX.",
  openGraph: {
    title: "Highlander REI",
    description: "Sell, explore your options, or invest in real estate with Highlander REI.",
    url: "https://highlanderrei.com",
    siteName: "Highlander REI",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${inter.variable}`}>
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <LanguageProvider>
          <Nav />
          <main style={{ flex: 1 }}>{children}</main>
          <Footer />
        </LanguageProvider>
        <Script
          src="https://beta.leadconnectorhq.com/loader.js"
          data-resources-url="https://beta.leadconnectorhq.com/chat-widget/loader.js"
          data-widget-id="6a1d8016b2d4c061bc2c2164"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
