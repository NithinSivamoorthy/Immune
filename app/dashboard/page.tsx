import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans_Condensed } from "next/font/google";
import CommandCenter from "@/components/command-center";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-immune-display", display: "swap" });
const technical = IBM_Plex_Sans_Condensed({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-immune-technical", display: "swap" });

export const metadata: Metadata = {
  title: "IMMUNE | Control room",
  description: "Monitor agent actions, learn safeguards and verify protection.",
};

export default function DashboardPage() {
  return <CommandCenter className={`${display.variable} ${technical.variable}`} />;
}
