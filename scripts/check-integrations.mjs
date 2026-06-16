// Connectivity check for the non-Supabase / non-Stripe integrations.
// Read-only where possible; PostHog + Sentry send ONE clearly-labelled test
// event so you can confirm data lands in their dashboards.
//   node --env-file=.env.local scripts/check-integrations.mjs
import crypto from "node:crypto";

const ok = (s) => `\x1b[32m${s}\x1b[0m`;
const bad = (s) => `\x1b[31m${s}\x1b[0m`;
const dim = (s) => `\x1b[90m${s}\x1b[0m`;
const line = (label, status, detail) =>
  console.log(`${label.padEnd(12)} ${status}  ${dim(detail ?? "")}`);

// ---------- Resend (transactional email) ----------
async function checkResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return line("Resend", bad("MISSING"), "no RESEND_API_KEY");
  try {
    const r = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      const domains = (j.data ?? []).map((d) => `${d.name}(${d.status})`);
      line(
        "Resend",
        ok("LIVE"),
        domains.length
          ? `verified domains: ${domains.join(", ")}`
          : "key valid, but NO verified domain — sends only reach your own Resend account email"
      );
    } else {
      line("Resend", bad(`HTTP ${r.status}`), j.message ?? "key rejected");
    }
  } catch (e) {
    line("Resend", bad("ERROR"), e.message);
  }
}

// ---------- Discord (bot identity + guild + role) ----------
async function checkDiscord() {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guild = process.env.DISCORD_GUILD_ID;
  const role = process.env.DISCORD_MEMBER_ROLE_ID;
  if (!token) return line("Discord", bad("MISSING"), "no DISCORD_BOT_TOKEN");
  const H = { Authorization: `Bot ${token}` };
  try {
    const me = await fetch("https://discord.com/api/v10/users/@me", { headers: H });
    if (!me.ok) return line("Discord", bad(`HTTP ${me.status}`), "bot token rejected");
    const bot = await me.json();

    const g = await fetch(`https://discord.com/api/v10/guilds/${guild}`, { headers: H });
    const gj = await g.json().catch(() => ({}));
    const guildName = g.ok ? gj.name : `guild ${g.status}`;

    const rr = await fetch(`https://discord.com/api/v10/guilds/${guild}/roles`, { headers: H });
    const roles = rr.ok ? await rr.json() : [];
    const found = Array.isArray(roles) && roles.find((x) => x.id === role);

    line(
      "Discord",
      ok("LIVE"),
      `bot ${bot.username} · guild "${guildName}" · member role: ${
        found ? `"${found.name}"` : bad("NOT FOUND")
      }`
    );
  } catch (e) {
    line("Discord", bad("ERROR"), e.message);
  }
}

// ---------- OneSignal (web push) ----------
async function checkOneSignal() {
  const appId = process.env.ONESIGNAL_APP_ID;
  const key = process.env.ONESIGNAL_API_KEY;
  if (!appId || !key) return line("OneSignal", bad("MISSING"), "app id / api key missing");
  try {
    const r = await fetch(`https://api.onesignal.com/apps/${appId}`, {
      headers: { Authorization: `Key ${key}` },
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) {
      line(
        "OneSignal",
        ok("LIVE"),
        `app "${j.name}" · ${j.players ?? 0} subscribed devices  [not wired into app yet]`
      );
    } else {
      line("OneSignal", bad(`HTTP ${r.status}`), j.errors ?? "key rejected");
    }
  } catch (e) {
    line("OneSignal", bad("ERROR"), e.message);
  }
}

// ---------- PostHog (product analytics) — sends a test event ----------
async function checkPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  if (!key) return line("PostHog", bad("MISSING"), "no NEXT_PUBLIC_POSTHOG_KEY");
  try {
    const r = await fetch(`${host}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event: "integration_check",
        distinct_id: "integration-check-script",
        properties: { source: "check-integrations.mjs" },
      }),
    });
    if (r.ok) {
      line("PostHog", ok("LIVE"), `test event sent → look for "integration_check" in Activity`);
    } else {
      line("PostHog", bad(`HTTP ${r.status}`), await r.text());
    }
  } catch (e) {
    line("PostHog", bad("ERROR"), e.message);
  }
}

// ---------- Sentry (error monitoring) — sends a test event ----------
async function checkSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return line("Sentry", bad("MISSING"), "no SENTRY_DSN");
  try {
    const u = new URL(dsn);
    const publicKey = u.username;
    const projectId = u.pathname.replace("/", "");
    const endpoint = `https://${u.host}/api/${projectId}/envelope/`;
    const eventId = crypto.randomUUID().replace(/-/g, "");
    const envelope =
      JSON.stringify({ event_id: eventId, sent_at: new Date().toISOString() }) +
      "\n" +
      JSON.stringify({ type: "event" }) +
      "\n" +
      JSON.stringify({
        event_id: eventId,
        level: "info",
        platform: "javascript",
        message: "Glow Room integration check — safe to ignore",
        timestamp: Date.now() / 1000,
      });
    const r = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${publicKey}, sentry_client=glowroom-check/1.0`,
      },
      body: envelope,
    });
    if (r.ok) {
      line("Sentry", ok("LIVE"), `test event sent → look for an "info" event in Issues  [not wired into app yet]`);
    } else {
      line("Sentry", bad(`HTTP ${r.status}`), await r.text());
    }
  } catch (e) {
    line("Sentry", bad("ERROR"), e.message);
  }
}

console.log("\nIntegration connectivity check\n" + "-".repeat(34));
await checkResend();
await checkDiscord();
await checkOneSignal();
await checkPostHog();
await checkSentry();
console.log("");
