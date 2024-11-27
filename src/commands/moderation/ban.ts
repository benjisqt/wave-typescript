import { Command } from "../../structures/Command";
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import reply from "../../functions/reply";
import cases from "../../models/moderation/cases";
import ms from "ms";

export default new Command({
  name: "ban",
  description: "Ban a member from the server.",
  userPermissions: ["BanMembers"],
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
    const softban = opts.getBoolean("softban") || false;
    const silent = opts.getBoolean("silent") || false;

    // check if member exists
    const member = await guild.members.cache.get(user.id);
    if (!member)
      throw "That member is not in this server; they cannot be banned.";

    const clientMember = await guild.members.cache.get(client.user.id);

    // check role pos
    if (member.roles.highest.position >= clientMember.roles.highest.position)
      throw "Role position error; I cannot ban that user because they are higher than me.";

    if (member.permissions.has("Administrator"))
      throw "That user has Administrator; they cannot be banned.";

    if (
      member.roles.highest.position >= interaction.member.roles.highest.position
    )
      throw "Role position error; I cannot ban that user because they are higher than you.";

    if (member.id === interaction.member.id) throw "You cnanot ban yourself.";

    if (!member.bannable) throw "Error; user is not bannable.";

    await guild.fetchOwner();
    if (guild.ownerId === member.id) throw "You cannot ban the server owner.";

    if (softban === true) {
      try {
        await member.ban({ reason: `${reason}` });
        await guild.bans.remove(user, "Softbanned");
      } catch (err) {}
    } else {
    }
  },
});
