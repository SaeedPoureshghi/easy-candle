"use client";

import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import IconButton from "@/components/IconButton";
import { formatPnl, unrealizedPnl } from "@/lib/paperTrade";
import { useReplayStore } from "@/store/replayStore";

export default function TradeButtons() {
  const mode = useReplayStore((s) => s.mode);
  const replayStatus = useReplayStore((s) => s.replayStatus);
  const replayLoading = useReplayStore((s) => s.replayLoading);
  const position = useReplayStore((s) => s.position);
  const currentCandle = useReplayStore((s) => s.currentCandle);
  const paperBuy = useReplayStore((s) => s.paperBuy);
  const paperSell = useReplayStore((s) => s.paperSell);

  if (mode !== "replay") return null;

  const disabled =
    replayLoading || replayStatus === "ended" || !currentCandle;
  const pnl = unrealizedPnl(position, currentCandle?.close);

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-l border-zinc-800 pl-2">
      <IconButton
        label="Buy / go long"
        disabled={disabled}
        onClick={paperBuy}
        tone="success"
        active={position?.side === "long"}
        className="!w-auto gap-1 px-2"
      >
        <ArrowUpCircle className="h-4 w-4" />
        <span className="text-xs font-semibold">Buy</span>
      </IconButton>
      <IconButton
        label="Sell / go short"
        disabled={disabled}
        onClick={paperSell}
        tone="danger"
        active={position?.side === "short"}
        className="!w-auto gap-1 px-2"
      >
        <ArrowDownCircle className="h-4 w-4" />
        <span className="text-xs font-semibold">Sell</span>
      </IconButton>

      {position && (
        <span
          className={`ml-1 text-[11px] tabular-nums ${
            pnl != null && pnl >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
          title="Unrealized PnL vs current close (1 unit)"
        >
          {position.side.toUpperCase()} @ {position.entryPrice.toFixed(2)} ·{" "}
          {formatPnl(pnl)}
        </span>
      )}
    </div>
  );
}
