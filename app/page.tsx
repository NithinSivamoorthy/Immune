import PublicSite from "@/components/marketing/site";
import { Space_Grotesk, IBM_Plex_Sans_Condensed } from "next/font/google";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-immune-display", display: "swap" });
const technical = IBM_Plex_Sans_Condensed({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-immune-technical", display: "swap" });

export default function Home() {
  return <PublicSite className={`${display.variable} ${technical.variable}`} />;
}

function SummaryCard({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: number | string;
  detail: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0d131b] p-4 sm:p-5">
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tracking-tight ${color}`}>{value}</p>
      <p className="mt-2 text-[11px] text-slate-500">{detail}</p>
    </div>
  );
}
