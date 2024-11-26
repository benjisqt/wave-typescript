import { Command } from "../../structures/Command";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import cases from "../../models/moderation/cases";
import reply from "../../functions/reply";
import ms from "ms";
import buttonPages from "../../functions/pagination";
import warnLimits from "../../models/moderation/warn-limits";

export default new Command({
  name: "moderation",
  description: "Manage members efficiently and quickly.",
  devOnly: true,
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
    const reason = opts.getString("reason") || "No reason provided.";
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
                    currentPage.setFooter({
                      text: `wave, by Aurion Development™️.`,
                    });
                    currentPage.setThumbnail(user.displayAvatarURL());
                  });

                  try {
                    await buttonPages(interaction, pages, 60000);
                  } catch (err) {}
                } else {
                  const modCase = await cases.findById(caseId);
                  if (!modCase) throw "That moderation case was not found.";

                  let thumbnail;
                  const user = await client.users.cache.get(modCase.User);
                  thumbnail = user ? user.displayAvatarURL() : guild.iconURL();

                  return interaction.reply({
                    embeds: [
                      new EmbedBuilder()
                        .setTitle(`Case - ${caseId}`)
                        .setDescription(
                          `**Type:** ${modCase.Type}\n**Reason:** ${modCase.Reason}\n**Moderator:** <@${modCase.Moderator}>`
                        )
                        .setColor("Aqua")
                        .setThumbnail(thumbnail)
                        .setFooter({
                          text: `wave, by Aurion Development™️.`,
                        }),
                    ],
                    ephemeral: true,
                  });
                }
              }
              break;

            case "delete":
              {
                if (!interaction.member.permissions.has("ViewAuditLog")) {
                  throw 'You must have the "View Audit Log" permission to delete moderation cases.';
                }
                const modCase = await cases.findById(caseId);
                if (!modCase) throw "That mod case was not found.";

                const button1 = new ButtonBuilder()
                  .setCustomId("confirm")
                  .setLabel("Confirm")
                  .setStyle(ButtonStyle.Success);

                const button2 = new ButtonBuilder()
                  .setCustomId("cancel")
                  .setLabel("Cancel")
                  .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
                  button1,
                  button2
                );

                const msg = await interaction.reply({
                  embeds: [
                    new EmbedBuilder()
                      .setTitle(`:warning: Confirmation Required`)
                      .setDescription(
                        `Confirmation is required for this action.\n**Are you sure you want to delete this moderation case?**`
                      )
                      .setColor("Orange")
                      .setThumbnail(client.user.displayAvatarURL())
                      .setFooter({ text: `wave, by Aurion Development™️.` }),
                  ],
                  components: [row],
                  ephemeral: true,
                });

                const collector = await msg.createMessageComponentCollector({
                  filter: (i) => i.user.id === interaction.user.id,
                  time: 30000,
                  componentType: ComponentType.Button,
                });

                collector.on("collect", async (i) => {
                  i.deferUpdate();
                  if (i.customId === "confirm") {
                    await modCase.deleteOne();

                    return msg.edit({
                      embeds: [
                        new EmbedBuilder()
                          .setTitle(`☑️ Action Confirmed`)
                          .setDescription(
                            `The mod case has been deleted.\n> Below are the details of said case:\n\n**Punishment:** ${modCase.Type}\n**Reason:** ${modCase.Reason}\n**User:** <@${modCase.User}>\n**Moderator:** <@${modCase.Moderator}>`
                          )
                          .setColor("Green")
                          .setThumbnail(client.user.displayAvatarURL())
                          .setFooter({
                            text: `wave, by Aurion Development™️.`,
                          }),
                      ],
                      components: [],
                    });
                  } else if (i.customId === "cancel") {
                    msg.edit({
                      embeds: [
                        new EmbedBuilder()
                          .setTitle(`❌ Confirmation Cancelled`)
                          .setDescription(
                            `Cancel button pressed.\n**Interaction cancelled.**`
                          )
                          .setColor("Red")
                          .setFooter({
                            text: `wave, by Aurion Development™️.`,
                          }),
                      ],
                      components: [],
                    });
                  } else return;
                });

                collector.on("end", async (i) => {
                  msg.edit({
                    embeds: [
                      new EmbedBuilder()
                        .setTitle(`❌ Confirmation Cancelled`)
                        .setDescription(
                          `A button was not interacted with in time.\n**Interaction cancelled, try again.**`
                        )
                        .setColor("Red")
                        .setFooter({
                          text: `wave, by Aurion Development™️.`,
                        }),
                    ],
                    components: [],
                  });
                });
              }
              break;

            case "clear":
              {
                const modCases = await cases.find({
                  Guild: guild.id,
                  User: user.id,
                });
                if (!modCases.length)
                  throw "That user does not have any moderation cases.";

                const button1 = new ButtonBuilder()
                  .setCustomId("confirm_cl")
                  .setLabel("Confirm")
                  .setStyle(ButtonStyle.Success);

                const button2 = new ButtonBuilder()
                  .setCustomId("cancel_cl")
                  .setLabel("Cancel")
                  .setStyle(ButtonStyle.Danger);

                const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
                  button1,
                  button2
                );

                const msg = await interaction.reply({
                  embeds: [
                    new EmbedBuilder()
                      .setTitle(`:warning: Confirmation Required`)
                      .setDescription(
                        `Confirmation is required for this action.\n**Are you sure you want to clear all of this users moderation cases?**`
                      )
                      .setColor("Orange")
                      .setThumbnail(client.user.displayAvatarURL())
                      .setFooter({
                        text: `wave, by Aurion Development™️.`,
                      }),
                  ],
                  components: [row],
                  ephemeral: true,
                });

                const collector = await msg.createMessageComponentCollector({
                  filter: (i) => i.user.id === interaction.user.id,
                  time: 30000,
                  componentType: ComponentType.Button,
                });

                collector.on("collect", async (i) => {
                  i.deferUpdate();
                  if (i.customId === "confirm") {
                    modCases.forEach(async (c) => {
                      await c.deleteOne();
                    });

                    return msg.edit({
                      embeds: [
                        new EmbedBuilder()
                          .setTitle(`☑️ Action Confirmed`)
                          .setDescription(
                            `All of <@${user.id}>'s moderation cases have been cleared.`
                          )
                          .setColor("Green")
                          .setThumbnail(client.user.displayAvatarURL())
                          .setFooter({
                            text: `wave, by Aurion Development™️.`,
                          }),
                      ],
                      components: [],
                    });
                  } else if (i.customId === "cancel") {
                    msg.edit({
                      embeds: [
                        new EmbedBuilder()
                          .setTitle(`❌ Confirmation Cancelled`)
                          .setDescription(
                            `Cancel button pressed.\n**Interaction cancelled.**`
                          )
                          .setColor("Red")
                          .setFooter({
                            text: `wave, by Aurion Development™️.`,
                          }),
                      ],
                      components: [],
                    });
                  } else return;
                });

                collector.on("end", async (i) => {
                  msg.edit({
                    embeds: [
                      new EmbedBuilder()
                        .setTitle(`❌ Confirmation Cancelled`)
                        .setDescription(
                          `A button was not interacted with in time.\n**Interaction cancelled, try again.**`
                        )
                        .setColor("Red")
                        .setFooter({
                          text: `wave, by Aurion Development™️.`,
                        }),
                    ],
                    components: [],
                  });
                });
              }
              break;
          }
        }
        break;

      case "timeout":
        {
          switch (sub) {
            case "add":
              {
                const member = await guild.members.cache.get(user.id);
                if (!member) throw "That member is not in this server.";

                const msdura = ms(duration);
                if (isNaN(msdura))
                  throw 'The duration provided is not a valid format.\nTry something like "30 seconds".';
              }
              break;

            case "remove":
              {
              }
              break;
          }
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

            case "settings":
              {
                const options = [
                  {
                    label: "Set warning limit",
                    value: "setlimit",
                    description:
                      "Set the limit of warnings a user can get before a kick.",
                  },
                  {
                    label: "Disable warning limit",
                    value: "disablelimit",
                    description:
                      "Disable the limit of warnings required to be kicked.",
                  },
                ];

                const selectMenu = new StringSelectMenuBuilder()
                  .setCustomId("warnsettings")
                  .setPlaceholder("Select a setting below...")
                  .setOptions(
                    options.map((opt) =>
                      new StringSelectMenuOptionBuilder()
                        .setDescription(opt.description)
                        .setLabel(opt.label)
                        .setValue(opt.value)
                    )
                  );

                const row =
                  new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                    selectMenu
                  );

                const msg = await interaction.reply({
                  embeds: [
                    new EmbedBuilder()
                      .setTitle(`Warning Settings - ${guild.name}`)
                      .setDescription(
                        `Please select an option below to configure the warning system.`
                      )
                      .setColor("Aqua")
                      .setThumbnail(client.user.displayAvatarURL()),
                  ],
                  ephemeral: true,
                  components: [row],
                });

                const collector = await msg.createMessageComponentCollector({
                  filter: (i) => i.user.id === interaction.user.id,
                  time: 30000,
                  componentType: ComponentType.StringSelect,
                });

                collector.on("collect", async (i) => {
                  const value = i.values[0];

                  switch (value) {
                    case "setlimit":
                      {
                        const WL = await warnLimits.findOne({
                          Guild: guild.id,
                        });
                        if (WL)
                          return i.reply({
                            content: `⛔️ | You must reset the warn limit before modifying it.`,
                            ephemeral: true,
                          });

                        const msgT = await i.reply({
                          content: `Please send below the limit of warnings until a user gets kicked.`,
                        });

                        const msgC = await i.channel.createMessageCollector({
                          filter: (m) => m.author.id === i.user.id,
                          max: 1,
                          time: 15000,
                        });

                        msgC.on("collect", async (m) => {
                          if (isNaN(parseInt(m.content)))
                            return msgT.edit({
                              content: `Command failed; number not detected.`,
                            });

                          if (parseInt(m.content) <= 0) {
                            return msgT.edit({
                              content: `Command failed; number equal to or lower than 0 are not accepted.`,
                            });
                          }

                          m.delete();

                          msgT.edit({
                            content: `System saved; ${m.content} warnings required for kick.`,
                          });

                          await warnLimits.create({
                            Guild: guild.id,
                            WarnLimit: parseInt(m.content),
                          });

                          msgC.stop();
                          setTimeout(() => {
                            msgT.delete();
                            return;
                          }, 3000);
                        });
                      }
                      break;

                    case "disablelimit":
                      {
                        const WL = await warnLimits.findOne({
                          Guild: guild.id,
                        });
                        if (!WL)
                          return i.reply({
                            content: `⛔️ | There is no warning limit set.`,
                            ephemeral: true,
                          });

                        await WL.deleteOne();

                        return i.reply({
                          content: `Warning limit removed.`,
                          ephemeral: true,
                        });
                      }
                      break;
                  }
                });

                collector.on("end", async (i) => {
                  return msg.edit({
                    embeds: [
                      new EmbedBuilder()
                        .setTitle(`Warning Settings - ${guild.name}`)
                        .setDescription(
                          `Please select an option below to configure the warning system.`
                        )
                        .setColor("Aqua")
                        .setThumbnail(client.user.displayAvatarURL()),
                    ],
                    components: [],
                  });
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
