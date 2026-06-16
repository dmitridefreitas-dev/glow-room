/**
 * Sends the purchase confirmation + Discord access code via Resend.
 * Best-effort: never throws (a failed email must not break provisioning).
 * NOTE: for real sends, verify a domain in Resend and change `from`. The
 * `onboarding@resend.dev` sender only delivers to your own Resend account email.
 */
export async function sendAccessEmail(
  to: string,
  code: string,
  appUrl: string
): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:auto;color:#22302c">
      <h1 style="color:#123f39">You're in 🤍</h1>
      <p>Welcome to The Glow Room. Two things to get started:</p>
      <p><strong>1. Your dashboard</strong><br>
        <a href="${appUrl}/dashboard" style="color:#e2785a">${appUrl}/dashboard</a></p>
      <p><strong>2. Unlock the private community</strong><br>
        Join the Discord, go to <strong>#verify</strong>, and run
        <code>/verify code:${code}</code></p>
      <p style="font-size:18px;background:#f8edd6;padding:12px 16px;border-radius:10px;display:inline-block">
        Your access code: <strong>${code}</strong></p>
      <p style="color:#6e726b;font-size:13px">This code works once and then expires. Don't share it.</p>
    </div>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "The Glow Room <onboarding@resend.dev>",
        to: [to],
        subject: "You're in 🤍 Your Glow Room access code",
        html,
      }),
    });
  } catch {
    // swallow — provisioning already succeeded; the code is also shown on /welcome
  }
}
