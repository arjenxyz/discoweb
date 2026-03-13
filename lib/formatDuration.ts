/**
 * Format duration in minutes to human-readable Turkish text.
 * duration_days column now stores MINUTES (not days).
 *
 * Examples:
 *   0       → "Süresiz"
 *   30      → "30dk"
 *   60      → "1sa"
 *   90      → "1sa 30dk"
 *   1440    → "1g"
 *   2880    → "2g"
 *   10080   → "7g"
 *   43200   → "30g"
 *   44640   → "31g"
 */
export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return 'Süresiz';

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}g`);
  if (hours > 0) parts.push(`${hours}sa`);
  if (mins > 0) parts.push(`${mins}dk`);

  return parts.join(' ') || 'Süresiz';
}

/** Full format for detail views */
export function formatDurationLong(minutes: number): string {
  if (!minutes || minutes <= 0) return 'Süresiz';

  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} Gün`);
  if (hours > 0) parts.push(`${hours} Saat`);
  if (mins > 0) parts.push(`${mins} Dakika`);

  return parts.join(' ') || 'Süresiz';
}
