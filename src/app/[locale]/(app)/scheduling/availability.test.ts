import { describe, expect, it } from "vitest";
import {
  computeSlots,
  normalizeIntervals,
  toClock,
  type ScheduleForSlots,
} from "./availability";

const dayStartMs = Date.UTC(2026, 0, 5, 0, 0, 0);

const base: ScheduleForSlots = {
  isActive: true,
  startMinute: 9 * 60,
  endMinute: 17 * 60,
  breakStartMinute: null,
  breakEndMinute: null,
  slotMinutes: 30,
};

function times(slots: ReturnType<typeof computeSlots>) {
  return slots.map((s) => s.time);
}

describe("toClock", () => {
  it("formats minutes from midnight", () => {
    expect(toClock(0)).toBe("00:00");
    expect(toClock(9 * 60 + 5)).toBe("09:05");
    expect(toClock(13 * 60 + 30)).toBe("13:30");
  });
});

describe("normalizeIntervals", () => {
  it("merges overlapping and adjacent intervals", () => {
    expect(normalizeIntervals([[540, 600], [600, 660]])).toEqual([[540, 660]]);
    expect(normalizeIntervals([[600, 660], [540, 600]])).toEqual([[540, 660]]);
    expect(normalizeIntervals([[540, 600], [610, 660]])).toEqual([
      [540, 600],
      [610, 660],
    ]);
  });

  it("drops empty intervals", () => {
    expect(normalizeIntervals([[600, 600]])).toEqual([]);
  });
});

describe("computeSlots", () => {
  it("returns no slots without a schedule", () => {
    expect(
      computeSlots({
        schedule: null,
        exceptions: [],
        appointments: [],
        dayStartMs,
      }),
    ).toEqual([]);
  });

  it("generates half-hour slots across the working day", () => {
    const slots = computeSlots({
      schedule: base,
      exceptions: [],
      appointments: [],
      dayStartMs,
    });
    expect(times(slots)).toEqual([
      "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
      "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
      "15:00", "15:30", "16:00", "16:30",
    ]);
    expect(slots.every((s) => s.available)).toBe(true);
  });

  it("removes break-time slots", () => {
    const slots = computeSlots({
      schedule: { ...base, breakStartMinute: 12 * 60, breakEndMinute: 13 * 60 },
      exceptions: [],
      appointments: [],
      dayStartMs,
    });
    const t = times(slots);
    expect(t).not.toContain("12:00");
    expect(t).not.toContain("12:30");
    expect(t).toContain("11:30");
    expect(t).toContain("13:00");
  });

  it("blocks the whole day for a timeless TIME_OFF exception", () => {
    const slots = computeSlots({
      schedule: base,
      exceptions: [{ type: "TIME_OFF", startMinute: null, endMinute: null }],
      appointments: [],
      dayStartMs,
    });
    expect(slots).toEqual([]);
  });

  it("suppresses slots that overlap a partial TIME_OFF", () => {
    const slots = computeSlots({
      schedule: base,
      exceptions: [{ type: "TIME_OFF", startMinute: 9 * 60, endMinute: 10 * 60 }],
      appointments: [],
      dayStartMs,
    });
    const t = times(slots);
    expect(t).not.toContain("09:00");
    expect(t).not.toContain("09:30");
    expect(t).toContain("10:00");
  });

  it("adds intervals for EXTRA_HOURS exceptions", () => {
    const slots = computeSlots({
      schedule: { ...base, endMinute: 10 * 60 },
      exceptions: [{ type: "EXTRA_HOURS", startMinute: 18 * 60, endMinute: 19 * 60 }],
      appointments: [],
      dayStartMs,
    });
    const t = times(slots);
    expect(t).toContain("09:30");
    expect(t).toContain("18:00");
    expect(t).toContain("18:30");
    expect(t).not.toContain("19:00");
  });

  it("marks slots overlapping an appointment as unavailable", () => {
    const apptStart = dayStartMs + 9 * 60 * 60_000;
    const slots = computeSlots({
      schedule: base,
      exceptions: [],
      appointments: [
        { id: "appt1", startMs: apptStart, endMs: apptStart + 30 * 60_000 },
      ],
      dayStartMs,
    });
    const nine = slots.find((s) => s.time === "09:00");
    const nineThirty = slots.find((s) => s.time === "09:30");
    expect(nine).toMatchObject({ available: false, appointmentId: "appt1" });
    expect(nineThirty?.available).toBe(true);
  });
});
