import { Command } from "../../structures/Command";
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";

export default new Command({
  name: "avatar",
  description: "View a user's avatar.",
  options: [
    {
      name: "user",
      description: "The user whose avatar you want to see.",
      type: ApplicationCommandOptionType.User,
    },
  ],

  run: async ({ interaction, opts }) => {
    const user = opts.getUser("user") || interaction.user;

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`Avatar`)
          .setImage(user.displayAvatarURL())
          .setAuthor({
            name: `${user.tag}`,
            iconURL: `${user.displayAvatarURL()}`,
          }),
      ],
    });
  },
});
