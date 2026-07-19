/**
 * Session paper-trade helpers.
 * One open position; fill at candle close; 1 unit; no fees/size/TP/SL.
 * Closed trades accumulate realized PnL for the current replay session only.
 *
 * @typedef {'long' | 'short'} PositionSide
 * @typedef {{
 *   id: string,
 *   side: PositionSide,
 *   entryPrice: number,
 *   entryTime: number,
 * }} Position
 * @typedef {{
 *   id: string,
 *   side: PositionSide,
 *   entryPrice: number,
 *   entryTime: number,
 *   exitPrice: number,
 *   exitTime: number,
 *   pnl: number,
 * }} ClosedTrade
 */

/**
 * @param {PositionSide} side
 * @param {number} entryPrice
 * @param {number} markPrice
 * @returns {number}
 */
export function pnlForSide(side, entryPrice, markPrice) {
  if (side === "long") return markPrice - entryPrice;
  return entryPrice - markPrice;
}

/**
 * Open a position only when flat.
 *
 * @param {Position | null} current
 * @param {PositionSide} side
 * @param {number} price
 * @param {number} time
 * @param {string} id
 * @returns {{ ok: true, position: Position } | { ok: false, reason: string }}
 */
export function openPosition(current, side, price, time, id) {
  if (side !== "long" && side !== "short") {
    return { ok: false, reason: "Invalid side" };
  }
  if (!Number.isFinite(price) || !Number.isFinite(time)) {
    return { ok: false, reason: "Invalid fill" };
  }
  if (current) {
    return { ok: false, reason: "Close the open position first" };
  }
  return {
    ok: true,
    position: {
      id,
      side,
      entryPrice: price,
      entryTime: time,
    },
  };
}

/**
 * Close the open position at mark price; returns realized trade.
 *
 * @param {Position} position
 * @param {number} exitPrice
 * @param {number} exitTime
 * @returns {ClosedTrade}
 */
export function closePosition(position, exitPrice, exitTime) {
  if (!position) {
    throw new Error("No open position");
  }
  if (!Number.isFinite(exitPrice) || !Number.isFinite(exitTime)) {
    throw new Error("Invalid exit fill");
  }
  return {
    id: position.id,
    side: position.side,
    entryPrice: position.entryPrice,
    entryTime: position.entryTime,
    exitPrice,
    exitTime,
    pnl: pnlForSide(position.side, position.entryPrice, exitPrice),
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
  return pnlForSide(position.side, position.entryPrice, markPrice);
}

/**
 * Sum of realized PnL from closed trades.
 *
 * @param {ClosedTrade[]} closedTrades
 * @returns {number}
 */
export function cumulativeRealizedPnl(closedTrades) {
  if (!Array.isArray(closedTrades) || !closedTrades.length) return 0;
  return closedTrades.reduce((sum, trade) => sum + trade.pnl, 0);
}

/**
 * Session performance = realized + optional unrealized.
 *
 * @param {ClosedTrade[]} closedTrades
 * @param {Position | null} open
 * @param {number | null | undefined} markPrice
 * @returns {{ realized: number, unrealized: number, total: number }}
 */
export function sessionPerformance(closedTrades, open, markPrice) {
  const realized = cumulativeRealizedPnl(closedTrades);
  const u = unrealizedPnl(open, markPrice);
  const unrealized = u == null ? 0 : u;
  return {
    realized,
    unrealized,
    total: realized + unrealized,
  };
}

/**
 * @param {number | null | undefined} pnl
 * @returns {string}
 */
export function formatPnl(pnl) {
  if (pnl == null || !Number.isFinite(pnl)) return "—";
  const sign = pnl > 0 ? "+" : "";
  return `${sign}${pnl.toFixed(2)}`;
}
