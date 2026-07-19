"use client";

import { useEffect } from "react";
import { useReplayStore } from "@/store/replayStore";

/**
 * @param {EventTarget | null} target
 * @returns {boolean}
 */
function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;

  return Boolean(target.closest("input, textarea, select, [contenteditable='true']"));
}

/**
 * Replay keyboard shortcuts:
 * - Space while playing → pause
 * - Space while paused/ready → step forward one candle
 */
export function useReplayHotkeys() {
  const mode = useReplayStore((s) => s.mode);
  const pause = useReplayStore((s) => s.pause);
  const stepForward = useReplayStore((s) => s.stepForward);

  useEffect(() => {
    if (mode !== "replay") return undefined;

    function onKeyDown(event) {
      if (event.code !== "Space" && event.key !== " ") return;
      if (event.repeat) return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();

      const state = useReplayStore.getState();
      if (state.mode !== "replay" || state.replayLoading) return;

      if (state.isPlaying) {
        pause();
        return;
      }

      if (state.replayStatus === "ended") return;
      stepForward();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, pause, stepForward]);
}
