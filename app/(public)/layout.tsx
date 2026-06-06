import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import LeadConnectorWidget from "@/components/LeadConnectorWidget";
import { LanguageProvider } from "@/lib/LanguageContext";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <Nav />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
      <LeadConnectorWidget />
    </LanguageProvider>
  );
}
