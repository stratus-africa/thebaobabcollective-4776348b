import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type FilterOption = { value: string; label: string };

type Props = {
  query: string;
  onQueryChange: (v: string) => void;
  queryPlaceholder?: string;
  category?: string;
  categoryOptions?: FilterOption[];
  categoryLabel?: string;
  onCategoryChange?: (v: string) => void;
  location?: string;
  locationOptions?: FilterOption[];
  onLocationChange?: (v: string) => void;
  sort: string;
  sortOptions: FilterOption[];
  onSortChange: (v: string) => void;
  resultCount: number;
  totalCount: number;
  onReset?: () => void;
  hasFilters?: boolean;
};

export function FilterBar({
  query,
  onQueryChange,
  queryPlaceholder = "Search…",
  category,
  categoryOptions,
  categoryLabel = "Category",
  onCategoryChange,
  location,
  locationOptions,
  onLocationChange,
  sort,
  sortOptions,
  onSortChange,
  resultCount,
  totalCount,
  onReset,
  hasFilters,
}: Props) {
  return (
    <div
      role="search"
      aria-label="Filter results"
      className="bg-background border border-border rounded-xl p-4 md:p-5 shadow-sm"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-3 items-stretch">
        <div className="relative min-w-0">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <label htmlFor="filter-search" className="sr-only">
            Search
          </label>
          <Input
            id="filter-search"
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={queryPlaceholder}
            className="pl-9 h-11"
          />
        </div>

        {categoryOptions && onCategoryChange ? (
          <div className="min-w-0">
            <label htmlFor="filter-category" className="sr-only">
              {categoryLabel}
            </label>
            <Select value={category ?? "all"} onValueChange={onCategoryChange}>
              <SelectTrigger id="filter-category" className="h-11 min-w-[10rem]">
                <SelectValue placeholder={categoryLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {categoryLabel.toLowerCase()}</SelectItem>
                {categoryOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {locationOptions && onLocationChange ? (
          <div className="min-w-0">
            <label htmlFor="filter-location" className="sr-only">
              Location
            </label>
            <Select value={location ?? "all"} onValueChange={onLocationChange}>
              <SelectTrigger id="filter-location" className="h-11 min-w-[10rem]">
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locationOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="min-w-0">
          <label htmlFor="filter-sort" className="sr-only">
            Sort by
          </label>
          <Select value={sort} onValueChange={onSortChange}>
            <SelectTrigger id="filter-sort" className="h-11 min-w-[10rem]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <p aria-live="polite">
          Showing <span className="text-foreground font-medium">{resultCount}</span> of {totalCount}
        </p>
        {hasFilters && onReset ? (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] tracking-[0.2em] uppercase text-foreground hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-sm px-3 py-2.5 min-h-[44px]"
          >
            <X className="w-3 h-3" aria-hidden="true" /> Clear filters
          </button>
        ) : null}
      </div>
    </div>
  );
}
