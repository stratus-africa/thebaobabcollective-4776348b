export function resolveImageSource(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    if (typeof value !== "string") continue;

    const normalized = value.trim();
    if (!normalized) continue;

    try {
      const decoded = decodeURIComponent(normalized);
      if (decoded) return decoded;
    } catch {
      if (normalized) return normalized;
    }
  }

  return null;
}
