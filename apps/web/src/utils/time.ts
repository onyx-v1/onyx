/**
 * IST time utilities — Indian Standard Time (UTC+05:30).
 *
 * ALL timestamps in the app are converted to IST regardless of the
 * user's device timezone. This gives every user the same timestamp
 * view, anchored to India.
 */
import { format } from 'date-fns';

// IST = UTC + 5 hours 30 minutes
const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1_000;

/** Shift a UTC Date by +5:30 so that HH:mm formatted via UTC methods gives IST. */
export function toIST(utcDate: Date): Date {
  return new Date(utcDate.getTime() + IST_OFFSET_MS);
}

/**
 * Returns a Date representing midnight IST of the given UTC date,
 * expressed in UTC. Used purely for day-boundary comparison.
 */
function istDayBoundary(utcDate: Date): number {
  const ist = toIST(utcDate);
  // Reconstruct as UTC-midnight using IST year/month/day
  return Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate());
}

/** Returns a stable "day key" string in IST — e.g. "2025-04-23" */
export function istDayKey(utcDate: Date): string {
  const ist = toIST(utcDate);
  const y   = ist.getUTCFullYear();
  const m   = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d   = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isTodayIST(utcDate: Date): boolean {
  return istDayBoundary(utcDate) === istDayBoundary(new Date());
}

export function isYesterdayIST(utcDate: Date): boolean {
  return istDayBoundary(new Date()) - istDayBoundary(utcDate) === 86_400_000;
}

/**
 * Format just the HH:mm time in IST.
 * Used for compact rows (hover timestamp).
 */
export function formatTimeOnlyIST(utcDate: Date): string {
  return format(toIST(utcDate), 'HH:mm');
}

/**
 * Full message timestamp in IST.
 * - Same day  → "14:32"
 * - Yesterday → "Yesterday 14:32"
 * - Older     → "23 Apr, 14:32"
 */
export function formatTimestampIST(utcDate: Date): string {
  if (isTodayIST(utcDate))     return format(toIST(utcDate), 'HH:mm');
  if (isYesterdayIST(utcDate)) return `Yesterday ${format(toIST(utcDate), 'HH:mm')}`;
  return format(toIST(utcDate), 'd MMM, HH:mm');
}

/**
 * Day separator label — Discord-style.
 * - "Today"     (IST)
 * - "Yesterday" (IST)
 * - "23 April 2025"
 */
export function formatDayLabelIST(utcDate: Date): string {
  if (isTodayIST(utcDate))     return 'Today';
  if (isYesterdayIST(utcDate)) return 'Yesterday';
  return format(toIST(utcDate), 'd MMMM yyyy');
}
