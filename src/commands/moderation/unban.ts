import { Command } from "../../structures/Command";
import {
  ApplicationCommandOptionType,
  ChannelType,
  EmbedBuilder,
} from "discord.js";
import cases from "../../models/moderation/cases";
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
          description: "The user you want to unban. (<@(userid)>)",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: "silent",
          description: "Enable if you want to send the message silently.",
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
          description: "Enable if you want to send the message silently.",
          type: ApplicationCommandOptionType.Boolean,
        },
      ],
    },
  ],

  run: async ({ interaction, guild, opts }) => {
    const sub = opts.getSubcommand();
    const user = opts.getUser("user");
    const silent = opts.getBoolean("silent") || false;
    const LS = await logging.findOne({ Guild: guild.id });

    switch (sub) {
      case "user":
        {
          const exists = await guild.bans.cache.find(
            (b) => b.user.id === user.id
          );
          if (!exists) throw "That user is not banned in this server.";

          await guild.bans.remove(user, `Unbanned by wave.`);

          const embed = new EmbedBuilder()
            .setTitle(`Member Unbanned`)
            .setDescription(`**A member has been unbanned from the server.**`)
            .setThumbnail(guild.iconURL())
            .setFooter({ text: `wave, by Aurion Development™️.` })
            .setColor("Aqua");

          if (LS) {
            const LC = await guild.channels.cache.get(LS.LogChannel);
            if (LC) {
              if (LC.isSendable() && LC.type === ChannelType.GuildText) {
                try {
                  LC.send({ embeds: [embed] });
                } catch (err) {
                  console.log(err);
                }
              }
            }
          }

          return interaction.reply({ embeds: [embed], ephemeral: silent });
        }
        break;

      case "all":
        {
          if (guild.bans.cache.size <= 0)
            throw "There are no members to unban, since none are banned.";
        }
        break;
    }
  },
});
