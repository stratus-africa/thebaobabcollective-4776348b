export function isSafePublicMediaPath(path: string | null | undefined): boolean {
  if (typeof path !== "string") return false;

  let normalized: string;
  try {
    normalized = decodeURIComponent(path).replace(/\\/g, "/").trim();
  } catch {
    return false;
  }

  if (!normalized || normalized === "/" || normalized.startsWith("/") || normalized.endsWith("/")) {
    return false;
  }

  if (normalized.includes("..") || normalized.includes("//") || normalized.includes("\\")) {
    return false;
  }

  const segments = normalized.split("/").filter(Boolean);
  if (segments.length === 0) return false;

  return segments.every((segment) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/i.test(segment));
}
