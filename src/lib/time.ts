export function nowMs(): number {
  return Date.now();
}

export function addSeconds(ms: number, seconds: number): number {
  return ms + seconds * 1000;
}

export function toIso(ms: number): string {
  return new Date(ms).toISOString();
}

export function isExpired(expiresAtMs: number): boolean {
  return Date.now() > expiresAtMs;
}
