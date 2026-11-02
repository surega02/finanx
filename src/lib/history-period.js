import { todayISO } from './format.js';

export function recentDates(days, today = todayISO()) {
  // Calculate calendar days without UTC conversion of the user's local "today"
  // and without DST-sensitive multiples of 24 hours.
  const start = new Date(`${today}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - days + 1);
  return { startDate: start.toISOString().slice(0, 10), endDate: today };
}

export function historyPeriod(range, today = todayISO()) {
  if (range === 'today') return recentDates(1, today);
  if (range === '7d') return recentDates(7, today);
  if (range === 'month') return { startDate: `${today.slice(0, 8)}01`, endDate: today };
  return null;
}
