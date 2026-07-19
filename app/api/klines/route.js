import { NextResponse } from "next/server";
import { fetchBinanceKlines, isHistoricalRange } from "@/lib/binance";
import { clampKlineLimit } from "@/lib/candleUtils";
import { isAllowedSymbol } from "@/lib/symbols";
import { isAllowedInterval } from "@/lib/timeframes";

/**
 * GET /api/klines?symbol=BTCUSDT&interval=1h&limit=100
 * Optional: startTime / endTime (Unix ms, Binance convention).
 *
 * Response: { candles: [{ time, open, high, low, close, volume? }] }
 * `time` is UTC seconds for lightweight-charts.
 */

function parseOptionalMs(value, name) {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) {
    return { error: `Invalid ${name}` };
  }
  return { value: Math.floor(n) };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const symbol = String(searchParams.get("symbol") || "").toUpperCase();
  const interval = String(searchParams.get("interval") || "");

  if (!symbol || !isAllowedSymbol(symbol)) {
    return NextResponse.json(
      { error: "Invalid or unsupported symbol" },
      { status: 400 },
    );
  }

  if (!interval || !isAllowedInterval(interval)) {
    return NextResponse.json(
      { error: "Invalid or unsupported interval" },
      { status: 400 },
    );
  }

  const startParsed = parseOptionalMs(searchParams.get("startTime"), "startTime");
  if (startParsed?.error) {
    return NextResponse.json({ error: startParsed.error }, { status: 400 });
  }

  const endParsed = parseOptionalMs(searchParams.get("endTime"), "endTime");
  if (endParsed?.error) {
    return NextResponse.json({ error: endParsed.error }, { status: 400 });
  }

  const startTime = startParsed?.value;
  const endTime = endParsed?.value;

  if (
    startTime != null &&
    endTime != null &&
    startTime >= endTime
  ) {
    return NextResponse.json(
      { error: "startTime must be less than endTime" },
      { status: 400 },
    );
  }

  const limit = clampKlineLimit(searchParams.get("limit"), 500);
  const historical = isHistoricalRange(endTime);
  const revalidate = historical ? 86400 : 60;

  try {
    const { candles } = await fetchBinanceKlines(
      { symbol, interval, startTime, endTime, limit },
      { revalidate },
    );

    const cacheControl = historical
      ? "public, s-maxage=86400, stale-while-revalidate=604800"
      : "public, s-maxage=60, stale-while-revalidate=300";

    return NextResponse.json(
      { candles },
      {
        status: 200,
        headers: {
          "Cache-Control": cacheControl,
        },
      },
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Upstream request failed";

    return NextResponse.json(
      { error: "Failed to fetch klines from Binance", detail: message },
      { status: 502 },
    );
  }
}
