export function resolveImageSource(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value !== "string") continue;

    const normalized = value.trim();
    if (!normalized) continue;

    const candidate = normalized.startsWith("blob:") || normalized.startsWith("data:") ? normalized : normalized;

    try {
      const decoded = decodeURIComponent(candidate);
      const clean = decoded.trim();
      if (clean) return clean;
    } catch {
      if (candidate) return candidate;
    }
  }

  return null;
}
