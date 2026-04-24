import { Job } from '../types';

export const TEACHER_FULL_DAY_RATE = 105.48;
export const AIDE_FULL_DAY_ESTIMATE = 88.99;
export const STANDARD_FULL_DAY_HOURS = 7;
export const AIDE_HOURLY_RATE = Number((AIDE_FULL_DAY_ESTIMATE / STANDARD_FULL_DAY_HOURS).toFixed(2));

export function getJobRole(job: Pick<Job, 'role'>): 'teacher' | 'aide' {
  return job.role === 'aide' ? 'aide' : 'teacher';
}

export function getRoleLabel(job: Pick<Job, 'role'>): string {
  return getJobRole(job) === 'aide' ? 'Instructional Assistant' : 'Teacher Sub';
}

export function getDefaultPayRate(role: 'teacher' | 'aide'): number {
  return role === 'aide' ? AIDE_HOURLY_RATE : TEACHER_FULL_DAY_RATE;
}

export function calculateExpectedPay(job: Job): number {
  const role = getJobRole(job);
  const rate = job.payRate || getDefaultPayRate(role);

  if (role === 'aide') {
    return Number((job.hours * rate).toFixed(2));
  }

  return Number((job.dayType * rate).toFixed(2));
}

export function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function toLocalDate(dateStr: string): Date {
  const d = new Date(dateStr);
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000);
}

export function getBiweeklyPeriodStart(dateStr: string): Date {
  const date = toLocalDate(dateStr);
  const anchor = new Date(2024, 0, 1);
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.floor((date.getTime() - anchor.getTime()) / dayMs);
  const periodOffset = Math.floor(diffDays / 14) * 14;
  return new Date(anchor.getTime() + periodOffset * dayMs);
}

export function getBiweeklyPeriodLabel(dateStr: string): string {
  const start = getBiweeklyPeriodStart(dateStr);
  const end = new Date(start);
  end.setDate(start.getDate() + 13);

  const format = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${format(start)} - ${format(end)}`;
}
