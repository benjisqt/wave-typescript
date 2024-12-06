import { Command } from "../../structures/Command";
import cases from "../../models/moderation/cases";
import ms from "ms";
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import logging from "../../models/utility/logging";

export default new Command({
  name: "timeout",
  description: "Timeout a user.",
  userPermissions: ["ModerateMembers"],
  clientPermissions: ["ModerateMembers"],
  options: [
    {
      name: "add",
      description: "Add a timeout to a user.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user you want to timeout.",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: "duration",
          description: "The duration of the timeout. (e.g. 2d)",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "reason",
          description: "The reason for timing out the user.",
          type: ApplicationCommandOptionType.String,
          maxLength: 120,
        },
        {
          name: "silent",
          description: "Send the message silently.",
          type: ApplicationCommandOptionType.Boolean,
        },
      ],
    },
    {
      name: "remove",
      description: "Remove a timeout from a user.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user whose timeout you want to remove.",
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
  ],

  run: async ({ interaction, guild, opts, client }) => {
    const sub = opts.getSubcommand();
    const user = opts.getUser("user");
    const silent = opts.getBoolean("silent") || false;
    const reason = opts.getString("reason") || "No reason provided.";
    const duration = opts.getString("duration");

    const member = await guild.members.cache.get(user.id);
    if (!member) throw "That member is not in this server.";

    const LS = await logging.findOne({ Guild: guild.id });
    const logChannel = LS
      ? await guild.channels.cache.get(LS.LogChannel)
      : null;

    if (sub === "add") {
      const msDuration = ms(duration);
      if (isNaN(msDuration))
        throw 'That is not a valid format for duration. Try something like "2d", "3h"';

      if (msDuration > 2419200000)
        throw "You cannot time someone out for more than 28 days.";

      if (!member.moderatable) throw "That member is not able to be timed out.";

      const clientMember = await guild.members.cache.get(client.user.id);

      if (
        member.roles.highest.position >=
        interaction.member.roles.highest.position
      )
        throw "You cannot time out that user; they have a higher role than you.";

      if (member.roles.highest.position >= clientMember.roles.highest.position)
        throw "I cannot time out that user; they have a higher role than me.";

      try {
        await member.timeout(msDuration, reason);

        await cases.create({
          Guild: guild.id,
          Moderator: interaction.member.id,
          Reason: reason,
          Type: "Timeout",
          User: member.id,
        });

        const expiry = Date.now() + msDuration;

        const embed = new EmbedBuilder()
          .setTitle(`Member Timed Out`)
          .setDescription(`A member has been timed out in this server.`)
          .setColor("Aqua")
          .setThumbnail(member.displayAvatarURL())
          .setFields(
            { name: `Member`, value: `<@${member.id}>`, inline: true },
            {
              name: `Moderator`,
              value: `<@${interaction.member.id}>`,
              inline: true,
            },
            {
              name: `Duration and Expiry`,
              value: `${duration} (<t:${Math.round(expiry / 1000)}:R>)`,
              inline: true,
            }
          );

        if (logChannel && logChannel.isSendable()) {
          logChannel.send({
            embeds: [embed],
          });
        }

        return interaction.reply({
          embeds: [embed],
          ephemeral: silent,
        });
      } catch (err) {
        throw `There was an error timing out the user: ${err}`;
      }
    } else if (sub === "remove") {
      if (!member.communicationDisabledUntil)
        throw "That member is not timed out.";

      try {
        await member.timeout(0);

        const embed = new EmbedBuilder()
          .setTitle(`Member Timeout Removed`)
          .setDescription(
            `*A member in this server has had their timeout removed.*`
          )
          .setColor("Aqua")
          .setThumbnail(member.displayAvatarURL())
          .setFields(
            { name: `Member`, value: `<@${member.id}>`, inline: true },
            {
              name: `Moderator`,
              value: `<@${interaction.member.id}>`,
              inline: true,
            }
          );

        if (logChannel && logChannel.isSendable()) {
          logChannel.send({
            embeds: [embed],
          });
        }

        return interaction.reply({
          embeds: [embed],
          ephemeral: silent,
        });
      } catch (err) {
        throw `There was a problem with timing out the user: ${err}`;
      }
    }
  },
});
