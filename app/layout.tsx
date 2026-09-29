import type { Metadata } from "next";
import Script from "next/script";
import { Roboto } from "next/font/google";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-ui",
  subsets: ["latin"],
  display: "swap",
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
    <html lang="en" className={roboto.variable}>
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {children}
        <Script
          src="https://widgets.leadconnectorhq.com/loader.js"
          data-resources-url="https://widgets.leadconnectorhq.com/chat-widget/loader.js"
          data-widget-id="6a5162fca126fb924dded5a7"
          data-source="WEB_USER"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
