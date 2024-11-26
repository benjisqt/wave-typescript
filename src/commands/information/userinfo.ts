import {
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
  ApplicationCommandOptionType,
} from "discord.js";
import { Command } from "../../structures/Command";
import fetch from "node-fetch";

export default new Command({
  name: "userinfo",
  description: "Get all or specific information about a user.",
  options: [
    {
      name: "user",
      description: "The user who you want to get info on.",
      type: ApplicationCommandOptionType.User,
    },
  ],

  run: async ({ interaction, guild, opts }) => {
    const user = opts.getUser("user");
    const member = await guild.members.cache.get(user.id);

    const offline = !member;

    const color = offline ? "Red" : "Aqua";
    const mode = offline ? "Offline Mode" : "Online Mode";

    const options = [
      {
        label: "All Info",
        value: "allinfo",
        description: "Get all info about this user.",
      },
      {
        label: "Avatar",
        value: "avatar",
        description: "Get this users avatar.",
      },
      {
        label: "Level Status",
        value: "levelstatus",
        description: "Get this users level, XP and required XP.",
      },
      {
        label: "Permissions",
        value: "permissions",
        description: "Get all of this users permissions.",
      },
    ];

    const infoOpts = new StringSelectMenuBuilder()
      .setCustomId("info")
      .setPlaceholder("Get info about this user...")
      .addOptions(
        options.map((option) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(option.label)
            .setDescription(option.description)
            .setValue(option.value)
        )
      );

    const row = new ActionRowBuilder().setComponents(infoOpts);

    const msg = await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(color)
          .setTitle(`${mode} - ${user.tag}`)
          .setDescription(
            "Please select one of the options below to get information about this user."
          )
          .setThumbnail(user.displayAvatarURL()),
      ],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === interaction.user.id,
      time: 30000,
      componentType: ComponentType.StringSelect,
    });

    collector.on("collect", async (i) => {
      const selection = i.values[0];
      const { id, tag, username, createdTimestamp, discriminator } = user;
    });
  },
});

async function getBadges(user) {
  const badges = [];
}
