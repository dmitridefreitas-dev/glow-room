"use client";

import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";

// Has the boot screen already played during this page load? Module-scoped so it
// survives client-side navigation (the dashboard layout stays mounted, so this
// won't replay when you move between tabs) but resets on a full reload — i.e. it
// plays once per "app launch", like a real game splash.
let SHOWN = false;

// Boot / splash screen — animated logo + loading bar, then tap-to-start (or it
// auto-advances). Sits above everything (z-60).
export function BootScreen() {
  const [show, setShow] = useState(!SHOWN);
  const [hiding, setHiding] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (SHOWN) return;
    SHOWN = true;
    const tReady = setTimeout(() => setReady(true), 1500);
    const tAuto = setTimeout(() => dismiss(), 4500);
    return () => {
      clearTimeout(tReady);
      clearTimeout(tAuto);
    };
  }, []);

  function dismiss() {
    setHiding(true);
    setTimeout(() => setShow(false), 500);
  }

  if (!show) return null;

  return (
    <div
      className={`boot ${hiding ? "hide" : ""}`}
      onClick={ready ? dismiss : undefined}
      role="button"
      tabIndex={0}
      aria-label="Start"
    >
      <Avatar stage={5} size={148} />
      <div className="text-center">
        <div className="font-display text-3xl font-extrabold tracking-game">THE GLOW ROOM</div>
        <div className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.3em] text-ivory/55">
          Glow Up Quest
        </div>
      </div>
      {ready ? (
        <button
          type="button"
          onClick={dismiss}
          className="boot-start text-sm font-extrabold uppercase tracking-[0.22em] text-honey"
        >
          ▶ Tap to start
        </button>
      ) : (
        <div className="loadbar">
          <i />
        </div>
      )}
    </div>
  );
}
