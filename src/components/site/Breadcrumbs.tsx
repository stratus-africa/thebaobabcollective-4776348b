import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

export type Crumb = {
  label: string;
  to?: string;
  params?: Record<string, string>;
};

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={`max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 py-3 border-b border-border/30 bg-background ${className ?? ""}`}
    >
      <ol className="flex flex-wrap items-center gap-2 text-[11px] tracking-[0.15em] uppercase font-medium text-foreground/60">
        <li className="flex items-center gap-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 hover:text-gold transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded-sm px-1"
          >
            <Home className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {items.map((c, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${c.label}-${i}`} className="flex items-center gap-2">
              <ChevronRight className="w-3 h-3 text-foreground/40 flex-shrink-0" aria-hidden="true" />
              {isLast || !c.to ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="text-foreground/80 truncate max-w-[60vw] font-medium"
                >
                  {c.label}
                </span>
              ) : (
                <Link
                  to={c.to as any}
                  params={c.params as any}
                  className="hover:text-gold transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded-sm px-1"
                >
                  {c.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
