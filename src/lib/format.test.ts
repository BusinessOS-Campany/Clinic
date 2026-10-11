import { describe, expect, it } from "vitest";
import { fmtInt, fmtMoney, round2, toNumber } from "./format";

describe("format", () => {
  it("toNumber handles primitives and Decimal-like objects", () => {
    expect(toNumber(null)).toBe(0);
    expect(toNumber(undefined)).toBe(0);
    expect(toNumber("12.5")).toBe(12.5);
    expect(toNumber("abc")).toBe(0);
    expect(toNumber({ toNumber: () => 7 })).toBe(7);
  });

  it("round2 fixes float drift", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(10.005)).toBe(10.01);
    expect(round2(2.5)).toBe(2.5);
  });

  it("fmtMoney formats with insurance defaults", () => {
    expect(fmtMoney(null)).toBe("0");
    expect(fmtMoney("12")).toBe("12");
    expect(fmtMoney(1234.5)).toBe("1,234.5");
    expect(fmtMoney({ toNumber: () => 42 })).toBe("42");
  });

  it("fmtInt renders grouped integers", () => {
    expect(fmtInt(1234567)).toBe("1,234,567");
    expect(fmtInt(null)).toBe("0");
  });
});