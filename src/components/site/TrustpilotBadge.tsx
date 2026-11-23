import { Star } from "lucide-react";

export type TrustpilotInfo = { url?: string; score?: string; label?: string; reviews?: string };

export function TrustpilotBadge({ info, className = "" }: { info: TrustpilotInfo; className?: string }) {
  if (!info.url) return null;
  const score = Number(info.score) || 5;
  return (
    <a
      href={info.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Rated ${info.label || "Excellent"} on Trustpilot (opens in new tab)`}
      className={`inline-flex flex-wrap items-center gap-2 rounded-md px-3 py-2 border border-foreground/15 bg-background/60 hover:border-gold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${className}`}
    >
      <span className="font-serif text-sm font-medium text-foreground">{info.label || "Excellent"}</span>
      <span className="flex gap-0.5" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={`grid place-items-center h-5 w-5 ${i < Math.round(score) ? "bg-forest" : "bg-foreground/20"}`}>
            <Star className="h-3 w-3 fill-cream text-cream" />
          </span>
        ))}
      </span>
      <span className="text-xs text-foreground/70">
        {score.toFixed(1)}{info.reviews ? ` · ${info.reviews} reviews` : ""} on <strong className="text-foreground">Trustpilot</strong>
      </span>
    </a>
  );
}
