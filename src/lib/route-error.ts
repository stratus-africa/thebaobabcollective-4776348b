/**
 * Route error boundaries receive `error` as an unknown value, so message
 * extraction has to narrow it first.
 */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
