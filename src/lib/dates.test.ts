import { describe, expect, it } from "vitest";
import { addDays, parseISODate, startOfWeek, toISODate, weekDates } from "./dates";

describe("dates", () => {
  it("round-trips ISO dates", () => {
    expect(toISODate(new Date("2026-10-09T12:00:00Z"))).toBe("2026-10-09");
    expect(toISODate(parseISODate("2026-10-09"))).toBe("2026-10-09");
  });

  it("adds days across month boundaries", () => {
    const d = parseISODate("2026-01-31");
    expect(toISODate(addDays(d, 1))).toBe("2026-02-01");
    expect(toISODate(addDays(d, -30))).toBe("2026-01-01");
  });

  it("startOfWeek anchors to Monday (UTC)", () => {
    // 2026-10-09 is a Friday
    expect(toISODate(startOfWeek(parseISODate("2026-10-09")))).toBe("2026-10-05");
    // Sunday rolls back to previous Monday
    expect(toISODate(startOfWeek(parseISODate("2026-10-04")))).toBe("2026-09-28");
  });

  it("returns a 7-day contiguous week", () => {
    const week = weekDates(parseISODate("2026-10-09"));
    expect(week).toHaveLength(7);
    expect(toISODate(week[0]!)).toBe("2026-10-05");
    expect(toISODate(week[6]!)).toBe("2026-10-11");
  });
});