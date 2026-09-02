import { Search, X, Sparkles, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BEST_FOR_CATEGORIES, type BestForTag } from "@/lib/destinations.data";

interface DestinationFinderSectionProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  matchCount: number;
  totalCount: number;
  eyebrow?: string;
  title?: string;
  body?: string;
}

export function DestinationFinderSection({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  matchCount,
  totalCount,
  eyebrow,
  title,
  body,
}: DestinationFinderSectionProps) {
  const isFiltered = selectedCategory !== "All" || searchQuery.trim().length > 0;

  return (
    <section aria-labelledby="finder-heading" className="bg-cream/50 py-14 md:py-20 border-y border-border/50">
      <div className="max-w-[1920px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 md:mb-12">
          <p className="text-[11px] tracking-[0.35em] uppercase text-terracotta font-semibold mb-3 flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5" /> {eyebrow || "Destination Finder"}
          </p>
          <h2
            id="finder-heading"
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground leading-[1.12]"
          >
            {title || "What are you looking for?"}
          </h2>
          <p className="mt-3 text-foreground/75 text-base sm:text-lg leading-relaxed">
            {body ||
              "Every part of Kenya tells a different story. Select the experiences that match how you want to travel."}
          </p>
        </div>

        {/* Filter Badges & Search Row */}
        <div className="space-y-6">
          {/* Horizontal Scrolling Filter Badges */}
          <div
            className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-none justify-start lg:justify-center flex-nowrap lg:flex-wrap"
            role="toolbar"
            aria-label="Filter destinations by interest"
          >
            <button
              type="button"
              onClick={() => onSelectCategory("All")}
              className={`flex-shrink-0 px-5 py-3 rounded-full text-[11px] tracking-[0.2em] uppercase font-semibold transition-all ${
                selectedCategory === "All"
                  ? "bg-forest text-forest-foreground shadow-sm ring-2 ring-forest ring-offset-2 ring-offset-background"
                  : "bg-background text-foreground/75 hover:border-gold hover:text-gold border border-border shadow-xs"
              }`}
            >
              All Interests
            </button>

            {BEST_FOR_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(isSelected ? "All" : cat.id)}
                  className={`flex-shrink-0 px-4 sm:px-5 py-3 rounded-full text-[11px] tracking-[0.2em] uppercase font-semibold transition-all ${
                    isSelected
                      ? "bg-forest text-forest-foreground shadow-sm ring-2 ring-forest ring-offset-2 ring-offset-background"
                      : "bg-background text-foreground/75 hover:border-gold hover:text-gold border border-border shadow-xs"
                  }`}
                  title={cat.description}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Search Input and Status Bar */}
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/40" />
              <Input
                type="text"
                placeholder="Search by destination name, landscape or experience…"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-10 h-11 text-sm bg-background border-border/80 rounded-full focus-visible:ring-gold"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground p-2"
                  aria-label="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={() => {
                  onSelectCategory("All");
                  onSearchChange("");
                }}
                className="inline-flex items-center gap-1.5 text-xs text-terracotta hover:underline font-semibold whitespace-nowrap px-3 py-3 min-h-[44px]"
              >
                <X className="w-3.5 h-3.5" /> Reset Filters
              </button>
            )}
          </div>

          {/* Results Summary Counter */}
          <div className="text-center">
            <p className="text-xs text-foreground/60 tracking-wider uppercase font-medium">
              Showing <span className="font-semibold text-foreground">{matchCount}</span> of {totalCount} places in
              Kenya
              {selectedCategory !== "All" && (
                <>
                  {" "}
                  matching <span className="text-gold font-semibold">"{selectedCategory}"</span>
                </>
              )}
              {searchQuery.trim() && (
                <>
                  {" "}
                  for <span className="text-gold font-semibold">"{searchQuery}"</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
