import { Command } from "../../structures/Command";
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} from "discord.js";

export default new Command({
  name: "serverinfo",
  description: "Get info on the server.",
  options: [
    {
      name: "silent",
      description: "Deliver the message silently.",
      type: ApplicationCommandOptionType.Boolean,
    },
  ],

  run: async ({ interaction, guild, opts }) => {
    const silent = opts.getBoolean("silent") || false;

    const options = [
      {
        label: "Channels",
        value: "channelinfo",
        description: "Get information about channels in the server.",
        emoji: "💬",
      },
      {
        label: "All Info",
        value: "allinfo",
        description: "Get all server info.",
        emoji: "ℹ️",
      },
      {
        label: "Member Count",
        value: "membercount",
        description: "Get the member count of the server.",
        emoji: "👥",
      },
      {
        label: "Roles",
        value: "roles",
        description:
          "Get information about roles (e.g. Admin roles, Member roles)",
        emoji: "💼",
      },
    ];

    const selMenu = new StringSelectMenuBuilder()
      .setCustomId("serverinfo")
      .setOptions(
        options.map((opt) =>
          new StringSelectMenuOptionBuilder()
            .setDescription(opt.description)
            .setLabel(opt.label)
            .setValue(opt.value)
            .setEmoji(opt.emoji)
        )
      )
      .setPlaceholder("Select a server info option...");

    const selRow =
      new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(selMenu);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`Server Info`)
          .setDescription(`*Select an option below to get information.*`)
          .setColor("Aqua")
          .setThumbnail(guild.iconURL()),
      ],
      components: [selRow],
      ephemeral: silent,
    });
  },
});
