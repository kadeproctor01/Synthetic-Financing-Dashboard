export function parseIsoDateOnly(value: string): Date {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date: ${value}`);
  }
  return date;
}

export function toIsoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addMonthsIso(dateIso: string, months: number): string {
  const date = parseIsoDateOnly(dateIso);
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
  return toIsoDateOnly(result);
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = parseIsoDateOnly(startIso).getTime();
  const end = parseIsoDateOnly(endIso).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function minutesBetween(olderIso: string, newerIso: string): number {
  const older = new Date(olderIso).getTime();
  const newer = new Date(newerIso).getTime();
  if (Number.isNaN(older) || Number.isNaN(newer)) {
    return Number.POSITIVE_INFINITY;
  }
  return Math.max(0, (newer - older) / 60_000);
}
