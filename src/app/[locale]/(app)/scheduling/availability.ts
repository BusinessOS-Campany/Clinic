export type Interval = [number, number];

export type ScheduleForSlots = {
  isActive: boolean;
  startMinute: number;
  endMinute: number;
  breakStartMinute: number | null;
  breakEndMinute: number | null;
  slotMinutes: number;
};

export type ExceptionForSlots = {
  type: string;
  startMinute: number | null;
  endMinute: number | null;
};

export type Busy = { id: string; startMs: number; endMs: number };

export type AvailabilitySlot = {
  startMinute: number;
  time: string;
  available: boolean;
  appointmentId: string | null;
};

export function toClock(minute: number): string {
  const h = String(Math.floor(minute / 60)).padStart(2, "0");
  const m = String(minute % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export function normalizeIntervals(list: Interval[]): Interval[] {
  const sorted = list.filter(([s, e]) => e > s).sort((a, b) => a[0] - b[0]);
  const out: Interval[] = [];
  for (const iv of sorted) {
    const last = out[out.length - 1];
    if (last && iv[0] <= last[1]) last[1] = Math.max(last[1], iv[1]);
    else out.push([iv[0], iv[1]]);
  }
  return out;
}

/**
 * Pure availability computation. Working intervals come from the weekly
 * schedule; EXTRA_HOURS exceptions add intervals, TIME_OFF exceptions either
 * block a partial interval or (when timeless) the whole day. Existing
 * non-cancelled appointments mark slots as unavailable.
 */
export function computeSlots(input: {
  schedule: ScheduleForSlots | null;
  exceptions: ExceptionForSlots[];
  appointments: Busy[];
  dayStartMs: number;
}): AvailabilitySlot[] {
  const { schedule, exceptions, appointments, dayStartMs } = input;

  const base: Interval[] = [];
  if (schedule?.isActive) {
    const hasBreak =
      schedule.breakStartMinute != null &&
      schedule.breakEndMinute != null &&
      schedule.breakEndMinute > schedule.breakStartMinute;
    if (hasBreak) {
      base.push([schedule.startMinute, schedule.breakStartMinute!]);
      base.push([schedule.breakEndMinute!, schedule.endMinute]);
    } else {
      base.push([schedule.startMinute, schedule.endMinute]);
    }
  }

  const blocked: Interval[] = [];
  let fullDayOff = false;
  for (const ex of exceptions) {
    if (ex.type === "TIME_OFF") {
      if (ex.startMinute == null || ex.endMinute == null) fullDayOff = true;
      else blocked.push([ex.startMinute, ex.endMinute]);
    } else if (ex.startMinute != null && ex.endMinute != null) {
      base.push([ex.startMinute, ex.endMinute]);
    }
  }

  const intervals = fullDayOff ? [] : normalizeIntervals(base);
  const slotMinutes = schedule?.slotMinutes ?? 30;

  const slots: AvailabilitySlot[] = [];
  for (const [start, end] of intervals) {
    for (let m = start; m + slotMinutes <= end; m += slotMinutes) {
      if (blocked.some(([bs, be]) => m < be && m + slotMinutes > bs)) continue;
      const startMs = dayStartMs + m * 60_000;
      const endMs = startMs + slotMinutes * 60_000;
      const conflict = appointments.find(
        (a) => startMs < a.endMs && endMs > a.startMs,
      );
      slots.push({
        startMinute: m,
        time: toClock(m),
        available: !conflict,
        appointmentId: conflict?.id ?? null,
      });
    }
  }
  return slots;
}
