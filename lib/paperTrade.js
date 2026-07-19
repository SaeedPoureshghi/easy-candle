/**
 * Simple paper-trade helpers (v2).
 * One open position; fill at candle close; no size/fees/TP/SL.
 *
 * @typedef {'long' | 'short'} PositionSide
 * @typedef {{
 *   side: PositionSide,
 *   entryPrice: number,
 *   entryTime: number,
 * }} Position
 * @typedef {{
 *   time: number,
 *   side: PositionSide,
 *   price: number,
 * }} TradeFill
 */

/**
 * Open or flip to the requested side at `price` / `time`.
 *
 * @param {Position | null} current
 * @param {PositionSide} side
 * @param {number} price
 * @param {number} time
 * @returns {{ position: Position, fill: TradeFill }}
 */
export function applySide(current, side, price, time) {
  if (side !== "long" && side !== "short") {
    throw new Error("side must be long or short");
  }
  if (!Number.isFinite(price) || !Number.isFinite(time)) {
    throw new Error("Invalid fill price or time");
  }

  return {
    position: {
      side,
      entryPrice: price,
      entryTime: time,
    },
    fill: {
      time,
      side,
      price,
    },
  };
}

/**
 * Unrealized PnL in price units for a 1-unit position.
 *
 * @param {Position | null} position
 * @param {number | null | undefined} markPrice
 * @returns {number | null}
 */
export function unrealizedPnl(position, markPrice) {
  if (!position || markPrice == null || !Number.isFinite(markPrice)) {
    return null;
  }
  if (position.side === "long") {
    return markPrice - position.entryPrice;
  }
  return position.entryPrice - markPrice;
}

/**
 * @param {number | null} pnl
 * @returns {string}
 */
export function formatPnl(pnl) {
  if (pnl == null || !Number.isFinite(pnl)) return "—";
  const sign = pnl > 0 ? "+" : "";
  return `${sign}${pnl.toFixed(2)}`;
}
