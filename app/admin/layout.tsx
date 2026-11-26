import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import "./admin-theme.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-hl-sans", display: "swap" });
const serif = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], variable: "--font-hl-serif", display: "swap" });

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className={`hl-admin ${sans.variable} ${serif.variable}`}>{children}</div>;
}
