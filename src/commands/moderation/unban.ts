import { Command } from "../../structures/Command";
import {
  ApplicationCommandOptionType,
  ChannelType,
  EmbedBuilder,
} from "discord.js";
import logging from "../../models/utility/logging";

export default new Command({
  name: "unban",
  description: "Unban one or all members from the server.",
  options: [
    {
      name: "user",
      description: "Unban a user from the server.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user you want to unban.",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: "silent",
          description: "Send the message silently.",
          type: ApplicationCommandOptionType.Boolean,
        },
      ],
    },
    {
      name: "all",
      description: "Unban all members from the server.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "silent",
          description: "Send the message silently.",
          type: ApplicationCommandOptionType.Boolean,
        },
      ],
    },
  ],

  run: async ({ interaction, guild, opts }) => {
    const sub = opts.getSubcommand();
    const user = opts.getUser("user");
    const silent = opts.getBoolean("silent") || false;
    const logChannel = (await logging.findOne({ Guild: guild.id }))?.LogChannel;

    const embed = new EmbedBuilder()
      .setThumbnail(guild.iconURL())
      .setFooter({ text: "wave, by Aurion Development™️." })
      .setColor("Aqua");

    try {
      if (sub === "user") {
        const ban = guild.bans.cache.find((b) => b.user.id === user.id);
        if (!ban) throw "That user is not banned in this server.";

        await guild.bans.remove(user, `Unbanned by ${interaction.user.tag}`);
        embed
          .setTitle("Member Unbanned")
          .setDescription(`**${user.tag}** has been unbanned from the server.`);

        if (logChannel) {
          const channel = await guild.channels.fetch(logChannel);
          if (channel?.isSendable()) channel.send({ embeds: [embed] });
        }
      } else if (sub === "all") {
        // handle mass unban
        const bannedUsers = guild.bans.cache.map((ban) => ban.user.id);
        if (!bannedUsers.length) throw "No users are currently banned.";

        await Promise.all(
          bannedUsers.map((userId) =>
            guild.bans.remove(userId, `Mass unban by ${interaction.user.tag}`)
          )
        );

        embed
          .setTitle("All Members Unbanned")
          .setDescription("**All banned members have been unbanned.**");

        if (logChannel) {
          const channel = await guild.channels.fetch(logChannel);
          if (channel?.isSendable()) channel.send({ embeds: [embed] });
        }
      }

      return interaction.reply({ embeds: [embed], ephemeral: silent });
    } catch (err) {
      return interaction.reply({ content: err, ephemeral: true });
    }
  },
});
