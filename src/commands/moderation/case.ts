import { Command } from "../../structures/Command";
import {
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  EmbedBuilder,
} from "discord.js";
import cases from "../../models/moderation/cases";
import buttonPages from "../../functions/pagination";

export default new Command({
  name: "case",
  description: "Manage users moderation cases.",
  devOnly: true,
  userPermissions: ["ModerateMembers"],
  options: [
    {
      name: "view",
      description: "View a users active punishments.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user whose punishments you want to see.",
          type: ApplicationCommandOptionType.User,
          required: true,
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
      description: "Delete a users case.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "case-id",
          description: "The ID of the case you want to delete.",
          required: true,
          type: ApplicationCommandOptionType.String,
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

  run: async ({ interaction, guild, opts, client }) => {
    const sub = opts.getSubcommand();
    const user = opts.getUser("user");
    const caseId = opts.getString("case-id");

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
  },
});
