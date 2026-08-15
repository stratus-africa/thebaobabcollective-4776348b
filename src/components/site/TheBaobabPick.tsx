import { TreeDeciduous, Sparkles } from "lucide-react";

export type TheBaobabPickProps = {
  title?: string;
  note: string;
  author?: string;
  className?: string;
  variant?: "badge" | "callout" | "card";
};

export function TheBaobabPick({
  title = "The Baobab Pick",
  note,
  author = "Journey Designer's Note",
  className = "",
  variant = "callout",
}: TheBaobabPickProps) {
  if (variant === "badge") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full bg-forest text-cream border border-gold/40 px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium shadow-sm ${className}`}
      >
        <span className="text-gold" aria-hidden="true">🌳</span>
        <span>{title}</span>
      </span>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-gold/30 bg-gradient-to-br from-cream to-cream/40 p-6 md:p-7 shadow-sm ${className}`}
    >
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-full bg-forest text-gold flex items-center justify-center shrink-0 shadow-sm">
          <TreeDeciduous className="w-5 h-5" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] tracking-[0.28em] uppercase font-semibold text-terracotta">
              {title}
            </span>
            <span className="text-foreground/30">•</span>
            <span className="text-[10px] tracking-[0.18em] uppercase text-foreground/60">
              {author}
            </span>
          </div>
          <p className="font-serif text-lg md:text-xl text-foreground leading-relaxed italic">
            "{note}"
          </p>
        </div>
      </div>
    </div>
  );
}
