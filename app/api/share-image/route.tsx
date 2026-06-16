import { type ReactElement } from "react";
import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import {
  parseShareParams,
  type SharePayload,
  type ShareFormat,
} from "@/lib/share-token";
import { loadShareFonts } from "@/lib/og-fonts";
import { TIERS } from "@/lib/points";

// Public, signature-gated PNG of a member's progress. Snapshot stats live in the
// (signed) query string — no DB read, safe to cache hard, safe for crawlers.
// NOTE: Satori requires display:flex on any element with >1 child; we set it on
// every div (harmless on single-child leaves) to avoid that class of error.

const C = {
  spruce: "#123f39",
  spruceDark: "#0e3631",
  coral: "#e2785a",
  honey: "#e0a23c",
  sage: "#6ca77f",
  tealLight: "#a9d2cb",
  ivory: "#fbf8f1",
  ivory70: "rgba(251,248,241,0.72)",
  ivory15: "rgba(251,248,241,0.16)",
};

const bg = `linear-gradient(135deg, ${C.spruce}, ${C.spruceDark})`;

function bars() {
  return (
    <div style={{ display: "flex", flexDirection: "row" }}>
      <div style={{ display: "flex", width: 64, height: 14, borderRadius: 6, marginRight: 10, background: C.coral }} />
      <div style={{ display: "flex", width: 64, height: 14, borderRadius: 6, marginRight: 10, background: C.sage }} />
      <div style={{ display: "flex", width: 64, height: 14, borderRadius: 6, background: C.honey }} />
    </div>
  );
}

function linkText(p: SharePayload): string {
  return p.link ? p.link.replace(/^https?:\/\//, "") : "theglowroom";
}

function tierColors(label?: string): { from: string; to: string } | null {
  if (!label) return null;
  const t = TIERS.find((x) => x.label.toLowerCase() === label.toLowerCase());
  return t ? { from: t.from, to: t.to } : null;
}

function portrait(p: SharePayload, big: boolean) {
  const pct = Math.min(100, Math.round((p.completed / p.total) * 100));
  const numSize = big ? 440 : 300;
  const pad = big ? 100 : 80;
  const meta = `${p.completed}/${p.total} days complete · ${pct}%${
    p.badge ? `  ·  ${p.badge}` : ""
  }`;
  const tc = tierColors(p.tier);
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        padding: pad,
        background: bg,
        color: C.ivory,
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        {bars()}
        <div style={{ display: "flex", marginTop: 26, fontSize: 28, letterSpacing: 8, color: C.tealLight }}>
          THE GLOW ROOM
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {tc && (
          <div
            style={{
              display: "flex",
              marginBottom: 20,
              padding: "10px 28px",
              borderRadius: 999,
              background: `linear-gradient(135deg, ${tc.from}, ${tc.to})`,
              color: "#fff",
              fontSize: 30,
              letterSpacing: 4,
            }}
          >
            {(p.tier ?? "").toUpperCase()}
          </div>
        )}
        <div style={{ display: "flex", fontSize: 32, letterSpacing: 6, color: C.honey }}>
          CURRENT STREAK
        </div>
        <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: numSize, lineHeight: 1, color: C.ivory }}>
          {String(p.streak)}
        </div>
        <div style={{ display: "flex", marginTop: 4, fontSize: 38, color: C.ivory70 }}>
          DAY STREAK
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 38, color: C.ivory }}>
          {`${p.name}'s 30-day glow up`}
        </div>
        <div style={{ display: "flex", marginTop: 18, width: "100%", height: 24, borderRadius: 999, background: C.ivory15 }}>
          <div style={{ display: "flex", width: `${pct}%`, height: "100%", borderRadius: 999, background: C.honey }} />
        </div>
        <div style={{ display: "flex", marginTop: 14, fontSize: 32, color: C.ivory70 }}>
          {meta}
        </div>
        <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
          <div style={{ display: "flex", fontSize: 30, color: C.ivory }}>
            Start your own glow up
          </div>
          <div style={{ display: "flex", fontSize: 28, color: C.honey }}>
            {linkText(p)}
          </div>
        </div>
      </div>
    </div>
  );
}

function landscape(p: SharePayload) {
  const pct = Math.min(100, Math.round((p.completed / p.total) * 100));
  const meta = `${p.completed}/${p.total} days complete${
    p.badge ? `  ·  ${p.badge}` : ""
  }`;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
        padding: 70,
        background: bg,
        color: C.ivory,
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flexGrow: 1 }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {bars()}
          <div style={{ display: "flex", marginTop: 20, fontSize: 22, letterSpacing: 6, color: C.tealLight }}>
            THE GLOW ROOM
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 640 }}>
          <div style={{ display: "flex", fontSize: 46, lineHeight: 1.15, color: C.ivory }}>
            {`${p.name} is ${pct}% through a 30-day glow up`}
          </div>
          <div style={{ display: "flex", marginTop: 16, fontSize: 28, color: C.ivory70 }}>
            {meta}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 26, color: C.honey }}>
          {`Start your own · ${linkText(p)}`}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 380 }}>
        <div style={{ display: "flex", fontSize: 26, letterSpacing: 5, color: C.honey }}>
          STREAK
        </div>
        <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 300, lineHeight: 1, color: C.ivory }}>
          {String(p.streak)}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: C.ivory70 }}>
          days in a row
        </div>
      </div>
    </div>
  );
}

function invite(p: SharePayload, qr: string | null) {
  const pct = Math.min(100, Math.round((p.completed / p.total) * 100));
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        height: "100%",
        padding: 90,
        background: bg,
        color: C.ivory,
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {bars()}
        <div style={{ display: "flex", marginTop: 30, fontSize: 30, letterSpacing: 6, color: C.tealLight }}>
          THE GLOW ROOM
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", fontFamily: "Bricolage", fontSize: 72, color: C.ivory, textAlign: "center" }}>
          Glow up with me
        </div>
        <div style={{ display: "flex", marginTop: 12, fontSize: 32, color: C.ivory70, textAlign: "center" }}>
          {`${p.name} · ${pct}% through a 30-day glow up`}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ display: "flex", padding: 28, borderRadius: 32, background: C.ivory }}>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} width={420} height={420} alt="" />
          ) : (
            <div style={{ display: "flex", width: 420, height: 420 }} />
          )}
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 34, color: C.honey }}>
          {linkText(p)}
        </div>
      </div>

      <div style={{ display: "flex", fontSize: 30, color: C.ivory70 }}>
        Scan the code or tap the link to join my cohort
      </div>
    </div>
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const payload = parseShareParams(searchParams);
  if (!payload) {
    return new Response("Invalid or unsigned share parameters.", { status: 400 });
  }

  const format = (searchParams.get("format") as ShareFormat) ?? "story";
  const dims =
    format === "og"
      ? { width: 1200, height: 630 }
      : format === "square"
        ? { width: 1080, height: 1080 }
        : { width: 1080, height: 1920 };

  const fonts = await loadShareFonts();
  let element: ReactElement;
  if (format === "invite") {
    const qr = payload.link
      ? await QRCode.toDataURL(payload.link, {
          margin: 1,
          width: 480,
          color: { dark: "#123f39", light: "#fbf8f1" },
        })
      : null;
    element = invite(payload, qr);
  } else if (format === "og") {
    element = landscape(payload);
  } else {
    element = portrait(payload, format === "story");
  }

  return new ImageResponse(element, {
    ...dims,
    fonts: fonts.length ? fonts : undefined,
    headers: { "cache-control": "public, max-age=31536000, immutable" },
  });
}
