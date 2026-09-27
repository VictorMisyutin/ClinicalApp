import type { Patient } from '@/types/domain';

/** "WHITFIELD, Marcus" — surname first and uppercased, the way a board reads. */
export function boardName(patient: Patient): string {
  return `${patient.familyName.toUpperCase()}, ${patient.givenName}`;
}

export function demographics(patient: Patient): string {
  return `${patient.ageYears}${patient.sex}`;
}

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
});

export function clockTime(iso: string): string {
  if (!iso) return '--:--';
  return timeFormat.format(new Date(iso));
}

export function shortDate(iso: string): string {
  if (!iso) return '';
  return dateFormat.format(new Date(iso));
}

/** For datetime-local inputs, which want a naive local string. */
export function toInputValue(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromInputValue(value: string): string {
  return value ? new Date(value).toISOString() : '';
}

export type DueState = 'overdue' | 'soon' | 'later' | 'none';

export function dueState(iso: string, now = Date.now()): DueState {
  if (!iso) return 'none';
  const delta = new Date(iso).getTime() - now;
  if (delta < 0) return 'overdue';
  if (delta < 60 * 60 * 1000) return 'soon';
  return 'later';
}

/** "40m late", "in 2h 10m" — relative time is what people actually plan against. */
export function relativeDue(iso: string, now = Date.now()): string {
  if (!iso) return 'No due time';
  const delta = new Date(iso).getTime() - now;
  const minutes = Math.round(Math.abs(delta) / 60000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const span = hours > 0 ? `${hours}h ${rest}m` : `${minutes}m`;
  return delta < 0 ? `${span} late` : `in ${span}`;
}

export function countdown(iso: string, now = Date.now()): string {
  const delta = new Date(iso).getTime() - now;
  if (delta <= 0) return 'now';
  const minutes = Math.round(delta / 60000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours}h ${String(rest).padStart(2, '0')}m` : `${minutes}m`;
}

export function pluralise(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}
