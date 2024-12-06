import { Command } from "../../structures/Command";
import logging from "../../models/utility/logging";
import cases from "../../models/moderation/cases";
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";

export default new Command({
  name: "kick",
  description: "Kick a member from the server.",
  clientPermissions: ["KickMembers"],
  userPermissions: ["KickMembers"],
  options: [
    {
      name: "user",
      description: "The user you want to kick.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "reason",
      description: "The reason for kicking the user.",
      type: ApplicationCommandOptionType.String,
      maxLength: 120,
    },
    {
      name: "silent",
      description: "Send the message with an ephemeral reply.",
      type: ApplicationCommandOptionType.Boolean,
    },
  ],

  run: async ({ interaction, guild, opts, client }) => {
    const user = opts.getUser("user");
    const reason = opts.getString("reason") || "No reason provided.";
    const silent = opts.getBoolean("silent") || false;

    const member = await guild.members.cache.get(user.id);
    if (!member) throw "That member is not in this server.";

    const clientMember = await guild.members.cache.get(client.user.id);

    if (member.roles.highest.position >= clientMember.roles.highest.position)
      throw "I cannot kick this person; role heirarchy error.";

    if (
      member.roles.highest.position >= interaction.member.roles.highest.position
    )
      throw "I cannot kick this person; Their highest role is higher than yours.";

    if (!member.kickable) throw "This member is not kickable.";

    if (member.id === interaction.member.id) throw "You cannot kick yourself.";

    const LS = await logging.findOne({ Guild: guild.id });
    const logChannel = LS
      ? await guild.channels.cache.get(LS.LogChannel)
      : null;

    try {
      await member.kick(reason);

      if (logChannel && logChannel.isSendable()) {
        logChannel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Member Kicked`)
              .setDescription(`*A member has been kicked from the server.*`)
              .setColor("Aqua")
              .setFields(
                { name: `User`, value: `<@${member.id}>`, inline: true },
                {
                  name: `Moderator`,
                  value: `<@${interaction.member.id}>`,
                  inline: true,
                }
              )
              .setThumbnail(member.displayAvatarURL()),
          ],
        });
      }

      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`Member Kicked`)
            .setDescription(`*A member has been kicked from the server.*`)
            .setColor("Aqua")
            .setFields(
              { name: `User`, value: `<@${member.id}>`, inline: true },
              {
                name: `Moderator`,
                value: `<@${interaction.member.id}>`,
                inline: true,
              }
            )
            .setThumbnail(member.displayAvatarURL()),
        ],
      });
    } catch (err) {
      throw `A problem occurred kicking the user: ${err}`;
    }
  },
});
