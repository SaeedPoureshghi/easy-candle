import { describe, expect, it } from "vitest";
import { applySide, formatPnl, unrealizedPnl } from "./paperTrade.js";

describe("applySide", () => {
  it("opens a long", () => {
    const { position, fill } = applySide(null, "long", 100, 50);
    expect(position).toEqual({ side: "long", entryPrice: 100, entryTime: 50 });
    expect(fill.side).toBe("long");
  });

  it("flips short to long", () => {
    const open = applySide(null, "short", 90, 10).position;
    const { position } = applySide(open, "long", 95, 20);
    expect(position.side).toBe("long");
    expect(position.entryPrice).toBe(95);
  });
});

describe("unrealizedPnl", () => {
  it("computes long and short PnL", () => {
    expect(
      unrealizedPnl({ side: "long", entryPrice: 100, entryTime: 1 }, 110),
    ).toBeCloseTo(10);
    expect(
      unrealizedPnl({ side: "short", entryPrice: 100, entryTime: 1 }, 90),
    ).toBeCloseTo(10);
    expect(unrealizedPnl(null, 100)).toBeNull();
  });
});

describe("formatPnl", () => {
  it("formats signed values", () => {
    expect(formatPnl(1.2)).toBe("+1.20");
    expect(formatPnl(-3)).toBe("-3.00");
    expect(formatPnl(null)).toBe("—");
  });
});
