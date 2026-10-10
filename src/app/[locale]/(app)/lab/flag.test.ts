import { describe, expect, it } from "vitest";
import { computeFlag, isAbnormalFlag, isCriticalFlag, pickRange, type RangeLike } from "./flag";

const r = (o: Partial<RangeLike>): RangeLike => ({
  sex: "ANY",
  ageMinYears: null,
  ageMaxYears: null,
  low: null,
  high: null,
  criticalLow: null,
  criticalHigh: null,
  ...o,
});

describe("pickRange", () => {
  it("prefers a sex-specific range over ANY", () => {
    const ranges = [r({ sex: "ANY", low: 4, high: 11 }), r({ sex: "MALE", low: 13, high: 17 })];
    expect(pickRange(ranges, "MALE", 30)?.low).toBe(13);
    expect(pickRange(ranges, "FEMALE", 30)?.low).toBe(4);
  });

  it("selects the matching age band", () => {
    const ranges = [
      r({ ageMinYears: 0, ageMaxYears: 12, low: 5, high: 14 }),
      r({ ageMinYears: 13, low: 12, high: 16 }),
    ];
    expect(pickRange(ranges, null, 5)?.high).toBe(14);
    expect(pickRange(ranges, null, 40)?.high).toBe(16);
  });

  it("returns null when nothing applies", () => {
    expect(pickRange([r({ sex: "MALE" })], "FEMALE", 30)).toBeNull();
  });
});

describe("computeFlag", () => {
  const range = r({ low: 70, high: 100, criticalLow: 40, criticalHigh: 500 });

  it("flags normal in-range values", () => {
    expect(computeFlag(85, range)).toBe("NORMAL");
  });
  it("flags low and high", () => {
    expect(computeFlag(60, range)).toBe("LOW");
    expect(computeFlag(150, range)).toBe("HIGH");
  });
  it("flags critical thresholds", () => {
    expect(computeFlag(30, range)).toBe("CRITICAL_LOW");
    expect(computeFlag(600, range)).toBe("CRITICAL_HIGH");
  });
  it("returns null without a range or value", () => {
    expect(computeFlag(85, null)).toBeNull();
    expect(computeFlag(null, range)).toBeNull();
  });
});

describe("flag helpers", () => {
  it("detects critical and abnormal flags", () => {
    expect(isCriticalFlag("CRITICAL_HIGH")).toBe(true);
    expect(isCriticalFlag("HIGH")).toBe(false);
    expect(isAbnormalFlag("LOW")).toBe(true);
    expect(isAbnormalFlag("NORMAL")).toBe(false);
    expect(isAbnormalFlag(null)).toBe(false);
  });
});
