import type { Metadata } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const bebasNeue = Bebas_Neue({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
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
    <html lang="en" className={`${bebasNeue.variable} ${dmSans.variable}`}>
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Nav />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
