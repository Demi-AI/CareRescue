import type { LeaveRequest, Shift } from '../types';

export function weekdayOf(date: Date | string = new Date()): number {
  const value = typeof date === 'string' ? new Date(`${date}T12:00:00`) : date;
  const day = value.getDay();
  return day === 0 ? 7 : day;
}

export function isShiftOnDate(shift: Shift, date: Date | string = new Date()): boolean {
  return shift.weekday == null || shift.weekday === weekdayOf(date);
}

export function sameServiceDay(first: Shift, second: Shift): boolean {
  return first.weekday == null || second.weekday == null || first.weekday === second.weekday;
}

export function leaveAffectsShift(request: Pick<LeaveRequest, 'date' | 'endDate' | 'start' | 'end'>, shift: Shift): boolean {
  if (shift.weekday == null) return shift.start < request.end && shift.end > request.start;
  const first = new Date(`${request.date}T12:00:00`);
  const last = new Date(`${request.endDate || request.date}T12:00:00`);
  if (Number.isNaN(first.getTime()) || Number.isNaN(last.getTime()) || last < first) return false;
  for (const cursor = new Date(first); cursor <= last; cursor.setDate(cursor.getDate() + 1)) {
    if (weekdayOf(cursor) !== shift.weekday) continue;
    const firstDay = cursor.toDateString() === first.toDateString();
    const lastDay = cursor.toDateString() === last.toDateString();
    const windowStart = firstDay ? request.start : 0;
    const windowEnd = lastDay ? request.end : 1440;
    if (shift.start < windowEnd && shift.end > windowStart) return true;
  }
  return false;
}
