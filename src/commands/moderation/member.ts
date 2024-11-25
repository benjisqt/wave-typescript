import { Command } from "../../structures/Command";
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import cases from "../../models/moderation/cases";
import reply from "../../functions/reply";
import ms from "ms";
import buttonPages from "../../functions/pagination";

export default new Command({
  name: "moderation",
  description: "Manage members efficiently and quickly.",
  userPermissions: ["ModerateMembers"],
  options: [
    {
      name: "ban",
      description: "Ban a user from the server.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user you want to ban.",
          required: true,
          type: ApplicationCommandOptionType.User,
        },
        {
          name: "reason",
          description: "The reason for banning this user.",
          type: ApplicationCommandOptionType.String,
        },
        {
          name: "duration",
          description:
            "How long you want this user to be banned for. (e.g. 10m = 10 minutes)",
          type: ApplicationCommandOptionType.String,
        },
        {
          name: "softban",
          description:
            "Do you want this to be a softban? (Remove all user-sent messages, unban)",
          type: ApplicationCommandOptionType.Boolean,
        },
        {
          name: "silent",
          description: "Send this message with an ephemeral reply.",
          type: ApplicationCommandOptionType.Boolean,
        },
      ],
    },
    {
      name: "unban",
      description: "Unban one or all users from the server.",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "user",
          description: "Unban a user from the server.",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: "user",
              description: "The user you want to unban.",
              required: true,
              type: ApplicationCommandOptionType.User,
            },
            {
              name: "reason",
              description: "Do you want to provide a reason?",
              type: ApplicationCommandOptionType.String,
              maxLength: 1024,
            },
            {
              name: "silent",
              description: "Send this message with an ephemeral reply.",
              type: ApplicationCommandOptionType.Boolean,
            },
          ],
        },
        {
          name: "all",
          description: "Unban all users from the server.",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: "reason",
              description: "Do you want to provide a reason?",
              type: ApplicationCommandOptionType.String,
              maxLength: 1024,
            },
            {
              name: "silent",
              description: "Send this message with an ephemeral reply.",
              type: ApplicationCommandOptionType.Boolean,
            },
          ],
        },
      ],
    },
    {
      name: "kick",
      description: "Kick a user from the server.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user you want to kick from the server.",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: "reason",
          description: "The reason for kicking this user.",
          type: ApplicationCommandOptionType.String,
          maxLength: 1024,
        },
        {
          name: "silent",
          description: "Send this message with an ephemeral reply.",
          type: ApplicationCommandOptionType.Boolean,
        },
      ],
    },
    {
      name: "timeout",
      description: "Timeout a user in the server or remove their timeout.",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "add",
          description: "Add a timeout to a user.",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: "user",
              description: "The user you want to timeout.",
              required: true,
              type: ApplicationCommandOptionType.User,
            },
            {
              name: "duration",
              description:
                "The duration you want to timeout this user for. (e.g. 10m = 10 minutes)",
              type: ApplicationCommandOptionType.String,
              required: true,
            },
            {
              name: "reason",
              description: "The reason for timing out this user.",
              type: ApplicationCommandOptionType.String,
              maxLength: 1024,
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
              description: "Send this message with an ephemeral reply.",
              type: ApplicationCommandOptionType.Boolean,
            },
          ],
        },
      ],
    },
    {
      name: "warn",
      description: "Warning settings.",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "add",
          description: "Add a warning to a user.",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: "user",
              description: "The user who you want to add a warning to.",
              type: ApplicationCommandOptionType.User,
              required: true,
            },
            {
              name: "reason",
              description: "The reason for warning this user.",
              type: ApplicationCommandOptionType.String,
              required: true,
            },
            {
              name: "silent",
              description: "Send this message with an ephemeral reply.",
              type: ApplicationCommandOptionType.Boolean,
            },
          ],
        },
        {
          name: "settings",
          description: "Adjust settings for the warning system.",
          type: ApplicationCommandOptionType.Subcommand,
        },
      ],
    },
    {
      name: "punishments",
      description: "Manage member punishments.",
      type: ApplicationCommandOptionType.SubcommandGroup,
      options: [
        {
          name: "view",
          description: "View a user's active punishments.",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: "user",
              description: "The user whose punishments you want to see.",
              required: true,
              type: ApplicationCommandOptionType.User,
            },
            {
              name: "case-id",
              description: "The ID of a specific case if you have it.",
              type: ApplicationCommandOptionType.String,
            },
          ],
        },
        {
          name: "delete",
          description: "Delete a user's punishment/case.",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: "case-id",
              description:
                "The ID of the punishment (can be found using /punishment view)",
              type: ApplicationCommandOptionType.String,
              required: true,
            },
          ],
        },
        {
          name: "clear",
          description: "Clear a user of all of their punishments.",
          type: ApplicationCommandOptionType.Subcommand,
          options: [
            {
              name: "user",
              description: "The user whose punishments you want to clear.",
              type: ApplicationCommandOptionType.User,
              required: true,
            },
          ],
        },
      ],
    },
  ],

  run: async ({ interaction, guild, opts, client }) => {
    const sub = opts.getSubcommand();
    const subgroup = opts.getSubcommandGroup();

    // import all options
    const user = opts.getUser("user");
    const reason = opts.getString("reason");
    const duration = opts.getString("duration");
    const softban = opts.getBoolean("softban");
    const silent = opts.getBoolean("silent") || false;
    const caseId = opts.getString("case-id");

    // get subcommand groups and sort
    switch (subgroup) {
      case "punishments":
        {
          switch (sub) {
            case "view":
              {
                if (user && !caseId) {
                  const modProfile = await cases.find({
                    Guild: guild.id,
                    User: user.id,
                  });
                  if (!modProfile.length)
                    throw "That user does not have any punishments in this server.";

                  const pages: EmbedBuilder[] = [];
                  modProfile.forEach((punishment, index) => {
                    if (index % 3 === 0) {
                      pages.push(
                        new EmbedBuilder()
                          .setTitle("User Punishments")
                          .setColor("Red")
                      );
                    }

                    const currentPage = pages[pages.length - 1];
                    currentPage.setDescription(
                      `${currentPage.data.description || ""}\n\n**Case ${
                        index + 1
                      }:**\n` +
                        `**Case ID:** ${punishment._id}\n` +
                        `**Type:** ${punishment.Type}\n` +
                        `**Reason:** ${punishment.Reason}\n` +
                        `**Moderator:** <@${punishment.Moderator}>`
                    );
                  });

                  try {
                    await buttonPages(interaction, pages, 60000);
                  } catch (err) {}
                } else {
                }
              }
              break;
          }
        }
        break;

      case "timeout":
        {
        }
        break;

      case "unban":
        {
        }
        break;

      case "warn":
        {
          switch (sub) {
            case "add":
              {
                const member = await guild.members.cache.get(user.id);
                if (!member) throw "That member was not found in this server.";

                await cases.create({
                  Guild: guild.id,
                  Moderator: interaction.user.id,
                  Reason: `${reason || "No reason provided."}`,
                  Time: 0,
                  Type: "Warning",
                  User: member.id,
                });

                return interaction.reply({
                  embeds: [
                    new EmbedBuilder()
                      .setDescription(
                        `☑️ | <@${member.id}> has been warned.\n**Reason:** *${reason}*`
                      )
                      .setColor("Green")
                      .setAuthor({
                        iconURL: `${interaction.user.displayAvatarURL()}`,
                        name: `${interaction.user.tag}`,
                      }),
                  ],
                  ephemeral: silent,
                });
              }
              break;
          }
        }
        break;

      default:
        {
          if (sub) {
            // sort subcommands for non-grouped subcommands
            switch (sub) {
            }
          }
        }
        break;
    }
  },
});
