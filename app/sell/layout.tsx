import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sell Your Home | Highlander REI",
  description:
    "Choose how you sell. Get a fast cash offer in as little as 7 days, or let us invest in your property and get more when it sells — without handling a single repair.",
};

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
