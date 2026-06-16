const DISCORD_API = "https://discord.com/api/v10";

/**
 * Removes the paying-member role from a Discord user (used on refund / chargeback
 * / subscription cancel). Best-effort; never throws.
 */
export async function removeMemberRole(discordUserId: string): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const guild = process.env.DISCORD_GUILD_ID;
  const role = process.env.DISCORD_MEMBER_ROLE_ID;
  if (!token || !guild || !role || !discordUserId) return;

  try {
    await fetch(
      `${DISCORD_API}/guilds/${guild}/members/${discordUserId}/roles/${role}`,
      { method: "DELETE", headers: { Authorization: `Bot ${token}` } }
    );
  } catch {
    // ignore
  }
}
