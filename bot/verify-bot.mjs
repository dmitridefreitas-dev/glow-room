// The Glow Room — Discord verify bot.
// Registers a /verify slash command that validates a single-use access code
// against the app's /api/discord/redeem endpoint, then grants the Member role.
//
// Run:  npm install  (in this folder, once)
//       node --env-file=../theglowroom/.env.local verify-bot.mjs
// Requires env: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_MEMBER_ROLE_ID,
//               DISCORD_SHARED_SECRET   (REDEEM_URL optional)
// Bot setup: invite with "applications.commands" + "bot" scope, give it the
// Manage Roles permission, and place its role ABOVE the Member role.

import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  MessageFlags,
  Events,
} from "discord.js";

const {
  DISCORD_BOT_TOKEN,
  DISCORD_GUILD_ID,
  DISCORD_MEMBER_ROLE_ID,
  DISCORD_SHARED_SECRET,
} = process.env;
const REDEEM_URL =
  process.env.REDEEM_URL ?? "http://localhost:3000/api/discord/redeem";

for (const [k, v] of Object.entries({
  DISCORD_BOT_TOKEN,
  DISCORD_GUILD_ID,
  DISCORD_MEMBER_ROLE_ID,
  DISCORD_SHARED_SECRET,
})) {
  if (!v) {
    console.error(`Missing env var: ${k}`);
    process.exit(1);
  }
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Bot online as ${c.user.tag}`);
  const rest = new REST({ version: "10" }).setToken(DISCORD_BOT_TOKEN);
  const command = new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Unlock The Glow Room with your access code")
    .addStringOption((o) =>
      o.setName("code").setDescription("Your access code").setRequired(true)
    );
  await rest.put(
    Routes.applicationGuildCommands(c.user.id, DISCORD_GUILD_ID),
    { body: [command.toJSON()] }
  );
  console.log("✅ Registered /verify");
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "verify")
    return;

  const code = interaction.options.getString("code", true).trim();
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const res = await fetch(REDEEM_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": DISCORD_SHARED_SECRET,
      },
      body: JSON.stringify({ code, discord_user_id: interaction.user.id }),
    });
    const data = await res.json();

    if (!data.ok) {
      await interaction.editReply(`❌ ${data.error ?? "Could not verify."}`);
      return;
    }

    const member = await interaction.guild.members.fetch(interaction.user.id);
    await member.roles.add(DISCORD_MEMBER_ROLE_ID);
    await interaction.editReply(
      "✅ Verified — welcome to The Glow Room! 🤍 Your channels are unlocked."
    );
  } catch (err) {
    console.error(err);
    await interaction.editReply(
      "⚠️ Something went wrong. Make sure the app is running, then try again."
    );
  }
});

client.login(DISCORD_BOT_TOKEN);
