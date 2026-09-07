export const UNLIMITED_DAYS = 36500;

export type DurationUnit = "days" | "months" | "years";

export const unitToDays: Record<DurationUnit, number> = {
  days: 1,
  months: 30,
  years: 365,
};

/** Convert a stored validity_days value back into a { amount, unit } pair. */
export function daysToDuration(days: number): { amount: number; unit: DurationUnit } {
  if (days > 0 && days % 365 === 0) return { amount: days / 365, unit: "years" };
  if (days > 0 && days % 30 === 0) return { amount: days / 30, unit: "months" };
  return { amount: days, unit: "days" };
}

export function durationToDays(amount: number, unit: DurationUnit): number {
  return Math.max(1, Math.round(amount * unitToDays[unit]));
}

/** Human readable validity label, e.g. "1 Year", "6 Months", "7 Days", "Unlimited". */
export function validityLabel(days: number): string {
  if (!days || days >= UNLIMITED_DAYS) return "Unlimited";
  const { amount, unit } = daysToDuration(days);
  const singular = { days: "Day", months: "Month", years: "Year" }[unit];
  return `${amount} ${singular}${amount === 1 ? "" : "s"}`;
}

/** Short suffix used next to a price, e.g. "/year". */
export function priceSuffix(days: number): string {
  if (!days || days >= UNLIMITED_DAYS) return "one-time";
  const { amount, unit } = daysToDuration(days);
  const singular = { days: "day", months: "month", years: "year" }[unit];
  return amount === 1 ? `/${singular}` : `/${amount} ${singular}s`;
}
