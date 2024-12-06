import { Command } from "../../structures/Command";
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import cases from "../../models/moderation/cases";
import logging from "../../models/utility/logging";
import ms from "ms";

export default new Command({
  name: "ban",
  description: "Ban a member from the server.",
  userPermissions: ["BanMembers"],
  clientPermissions: ["BanMembers"],
  options: [
    {
      name: "user",
      description: "The user who you want to ban.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "reason",
      description: "The reason for banning the user.",
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "duration",
      description: "How long do you want to ban the user for? (Tempban)",
      type: ApplicationCommandOptionType.String,
    },
    {
      name: "softban",
      description:
        "Do you want to ban the user, delete their messages then unban them?",
      type: ApplicationCommandOptionType.Boolean,
    },
    {
      name: "silent",
      description:
        "Do you want the message to be sent ephemeral? (Not visible to other users)",
      type: ApplicationCommandOptionType.Boolean,
    },
  ],

  run: async ({ interaction, guild, opts, client }) => {
    const user = opts.getUser("user");
    const reason = opts.getString("reason") || "No reason provided.";
    const duration = opts.getString("duration");
    const softban = opts.getBoolean("softban");
    const silent = opts.getBoolean("silent") || false;

    const member = await guild.members.cache.get(user.id);
    if (!member) throw "That member is not in this server.";
    const clientMember = await guild.members.cache.get(client.user.id);

    // role pos checking
    if (member.roles.highest.position >= clientMember.roles.highest.position)
      throw "I cannot ban this user due to role heirarchy.";

    if (
      member.roles.highest.position >= interaction.member.roles.highest.position
    )
      throw "I cannot ban this user due to your role heirarchy.";

    if (member.id === interaction.user.id) throw "You cannot ban yourself.";

    if (member.permissions.has("Administrator"))
      throw "That user has Administrator permissions.";

    if (!member.bannable) throw "That member is not bannable.";

    if (guild.ownerId === member.id) throw "You cannot ban the server owner.";

    if (softban && duration) throw "Duration is not applicable for softban.";

    const embed = new EmbedBuilder()
      .setColor("Aqua")
      .setTitle(
        softban
          ? `Member Softbanned`
          : duration
          ? `Member Tempbanned`
          : `Member Banned`
      )
      .setDescription(
        `A member in this server has been ${
          softban ? `softbanned` : duration ? `temporarily banned` : `banned`
        }.`
      )
      .setFields(
        {
          name: `Moderator`,
          value: `<@${interaction.member.id}>`,
          inline: true,
        },
        { name: `User`, value: `<@${member.id}>`, inline: true }
      )
      .setThumbnail(member.displayAvatarURL());

    const LS = await logging.findOne({ Guild: guild.id });
    const logChannel = LS
      ? await guild.channels.cache.get(LS.LogChannel)
      : null;

    if (softban) {
      try {
        await member.ban({ reason: `${reason}` });
        await guild.bans.remove(user, `Softban`);
        await cases.create({
          Guild: guild.id,
          Moderator: interaction.member.id,
          Reason: reason,
          Type: `Softban`,
          User: member.id,
        });
        if (logChannel && logChannel.isSendable())
          logChannel.send({ embeds: [embed] });
        return interaction.reply({ embeds: [embed], ephemeral: silent });
      } catch (err) {
        throw `Error during softban: ${err}`;
      }
    }

    if (duration) {
      const msDuration = ms(duration);
      if (isNaN(msDuration))
        throw 'Invalid duration. Use formats like "1d", "2h"';
      const expiry = new Date(Date.now() + msDuration);
      embed.addFields({
        name: `Expiry`,
        value: `<t:${Math.floor(expiry.getTime() / 1000)}:R>`,
        inline: true,
      });

      await cases.create({
        Guild: guild.id,
        User: member.id,
        Moderator: interaction.user.id,
        Reason: reason,
        Time: msDuration,
        Type: "Tempban",
      });

      if (logChannel && logChannel.isSendable())
        logChannel.send({ embeds: [embed] });
      return interaction.reply({ embeds: [embed], ephemeral: silent });
    }

    try {
      await member.ban({ reason: reason });
      await cases.create({
        Guild: guild.id,
        Moderator: interaction.user.id,
        User: member.id,
        Reason: reason,
        Type: "Ban",
      });
      if (logChannel && logChannel.isSendable())
        logChannel.send({ embeds: [embed] });
      return interaction.reply({ embeds: [embed], ephemeral: silent });
    } catch (err) {
      throw `Error banning user: ${err}`;
    }
  },
});
