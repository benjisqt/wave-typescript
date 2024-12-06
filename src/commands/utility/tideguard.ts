import { Command } from "../../structures/Command";
import {
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
} from "discord.js";
import tideguard from "../../models/tideguard/tideguard";

export default new Command({
  name: "tideguard",
  description: "Configure wave's built-in security system.",
  userPermissions: ["ManageGuild"],

  run: async ({ interaction, guild }) => {
    const TG = await tideguard.findOne({ Guild: guild.id });

    const options = [
      {
        label: "NoAlt",
        description: `${
          TG ? (TG.NoAlt.Enabled ? `Configure` : `Setup`) : "Setup"
        } the NoAlt system.`,
        value: "noalt",
        emoji: `${TG ? (TG.NoAlt.Enabled ? "☑️" : "❌") : "❌"}`,
      },
      {
        label: "NoGhost",
        description: `Configure the NoGhost system.`,
        value: "noghost",
        emoji: `${TG ? (TG.NoGhost.Enabled ? "☑️" : "❌") : "❌"}`,
      },
      {
        label: "NoSpam",
        description: `Configure the NoSpam system.`,
        value: "nospam",
        emoji: `${TG ? (TG.NoSpam.Enabled ? "☑️" : "❌") : "❌"}`,
      },
    ];

    const selRow =
      new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
        new StringSelectMenuBuilder()
          .setCustomId("tideguard")
          .setOptions(
            options.map((opt) =>
              new StringSelectMenuOptionBuilder()
                .setDescription(opt.description)
                .setEmoji(opt.emoji)
                .setLabel(opt.label)
                .setValue(opt.value)
            )
          )
          .setPlaceholder(`Select a TideGuard configuration option...`)
      );

    const embed = new EmbedBuilder()
      .setTitle(`TideGuard ${TG ? "Setup" : "Configurator"}`)
      .setDescription(
        `Select any of the options presented below to configure TideGuard.`
      )
      .setColor("Aqua")
      .setThumbnail(guild.iconURL());

    return interaction.reply({
      embeds: [embed],
      components: [selRow],
    });
  },
});
