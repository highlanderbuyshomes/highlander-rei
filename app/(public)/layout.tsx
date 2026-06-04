import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/lib/LanguageContext";
import Script from "next/script";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <Nav />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <Script
        src="https://beta.leadconnectorhq.com/loader.js"
        data-resources-url="https://beta.leadconnectorhq.com/chat-widget/loader.js"
        data-widget-id="6a1d8016b2d4c061bc2c2164"
        strategy="afterInteractive"
      />
    </LanguageProvider>
  );
}
