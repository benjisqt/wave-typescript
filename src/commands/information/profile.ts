import { Command } from "../../structures/Command";
import profile from "../../models/information/profile";
import fetch from "node-fetch";
import emojis from "../../emojis.json";
import buttonPages from "../../functions/pagination";
import {
  EmbedBuilder,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  ApplicationCommandOptionType,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";

export default new Command({
  name: "profile",
  description: "See yours or others profiles.",
  options: [
    {
      name: "view",
      description: "View a user's profile.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user whose profile you want to see.",
          type: ApplicationCommandOptionType.User,
        },
      ],
    },
    {
      name: "add-note",
      description: "Add a note to someone's profile.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user who you want to add a note to.",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: "note",
          description: "The note you want to add to the player.",
          maxLength: 120,
          required: true,
          type: ApplicationCommandOptionType.String,
        },
      ],
    },
    {
      name: "remove-note",
      description: "Add a note to someone's profile.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user who you want to add a note to.",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
      ],
    },
    {
      name: "edit",
      description: "Edit your profile!",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  run: async ({ interaction, guild, opts }) => {
    const user = opts.getUser("user") || interaction.user;
    const note = opts.getString("note");
    const member = await guild.members.cache.get(user.id);
    const sub = opts.getSubcommand();

    const userProf = await profile.findOne({ User: user.id });

    switch (sub) {
      case "view":
        {
          const viewNotes = new ButtonBuilder()
            .setCustomId("viewusernotes")
            .setLabel("View Notes")
            .setStyle(ButtonStyle.Primary);

          const viewRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
            viewNotes
          );

          const embed = new EmbedBuilder()
            .setAuthor({
              name: `${user.tag}`,
              iconURL: `${user.displayAvatarURL()}`,
            })
            .setDescription(
              `No wave profile bio found.\n*To create one, run /profile edit!*`
            )
            .setColor("Aqua")
            .setFields({
              name: `User ID`,
              value: `${user.id}`,
              inline: true,
            })
            .setFooter({
              text: `Created <t:${Math.round(user.createdTimestamp / 1000)}:>`,
            });

          if (userProf) {
            if (userProf.Bio.length > 0) {
              embed.setDescription(`${userProf.Bio}`);
            }

            if (userProf.BadgesEnabled) {
              const badges = await getBadges(user);
              embed.setTitle(`${badges}`);
            }
          }

          if (member) {
            embed.addFields(
              {
                name: "Joined Server:",
                value: `<t:${Math.round(member.joinedTimestamp / 1000)}:>`,
                inline: true,
              },
              {
                name: `Voice Status:`,
                value: `${
                  member.voice.channel
                    ? `<#${member.voice.channel.id}>`
                    : "Not connected to voice."
                }`,
                inline: true,
              }
            );
          }

          const msg = await interaction.reply({
            embeds: [embed],
            components: [viewRow],
          });

          const collector = await msg.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
          });

          collector.on("collect", async (i) => {
            if (i.customId !== "viewnotes") return;

            const pages: EmbedBuilder[] = [];
            userProf.UserNotes.forEach((note, index) => {
              if (index % 3 === 0) {
                pages.push(
                  new EmbedBuilder().setTitle(`User Notes`).setColor("Aqua")
                );
              }

              const currentPage = pages[pages.length - 1];
              currentPage.setDescription(
                `${currentPage.data.description || ""}\n\n**${note.Name}** - ${
                  note.Note
                }`
              );
              currentPage.setThumbnail(user.displayAvatarURL());
            });

            try {
              await buttonPages(interaction, pages, 60000);
            } catch (err) {}
          });
        }
        break;

      case "add-note":
        {
          if (user.id === interaction.user.id)
            throw "You cannot leave a note on your own profile.";

          const userProf = await profile.findOne({ User: user.id });
          if (!userProf) {
            await profile.create({
              User: user.id,
              UserNotes: [{ Name: `${interaction.user.tag}`, Note: `${note}` }],
            });
          } else {
            userProf.UserNotes.push({
              Name: `${interaction.user.tag}`,
              Note: `${note}`,
            });
          }

          return interaction.reply({
            content: `You left a note on <@${user.id}>'s profile!\n**Note:** ${note}`,
            ephemeral: true,
          });
        }
        break;

      case "remove-note":
        {
          const userProf = await profile.findOne({ User: user.id });
          if (!userProf || userProf.UserNotes.length <= 0)
            throw "That user has no notes on their profile.";

          const noteIndex = userProf.UserNotes.findIndex(
            (note) => note.Name === interaction.user.tag
          );

          if (noteIndex === -1) {
            throw "You do not have a note on this person's profile.";
          }

          userProf.UserNotes.splice(noteIndex, 1);

          await userProf.save();

          return interaction.reply({
            content: `Successfully removed your note from <@${user.id}>'s profile.`,
            ephemeral: true,
          });
        }
        break;

      case "edit":
        {
          const options = [
            {
              label: "Edit Profile Bio",
              value: "editbio",
              description: "Edit your profile bio!",
            },
            {
              label: "Show/Hide Profile Badges",
              value: "showbadges",
              description: "Show/Hide your profile badges!",
            },
          ];

          const selRow =
            new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
              new StringSelectMenuBuilder()
                .setCustomId("editprofile")
                .setPlaceholder("Select an option to edit your profile...")
                .setOptions(
                  options.map((opt) =>
                    new StringSelectMenuOptionBuilder()
                      .setLabel(opt.label)
                      .setDescription(opt.description)
                      .setValue(opt.value)
                  )
                )
            );

          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle(`Edit your wave Profile!`)
                .setDescription(
                  `*Select any option below to edit your profile to your liking!*`
                )
                .setColor("Aqua")
                .setThumbnail(interaction.user.displayAvatarURL()),
            ],
            components: [selRow],
          });
        }
        break;
    }
  },
});

async function getBadges(user) {
  const badges = [];

  const dat = await fetch(`https://japi.rest/discord/v1/user/${user.id}`);
  const { data } = await dat.json();

  if (data && data.public_flags_array) {
    const userBadges = data.public_flags_array;

    if (userBadges.includes("STAFF")) badges.push(emojis.badges.staff);
    if (userBadges.includes("PARTNER")) badges.push(emojis.badges.partner);
    if (userBadges.includes("TEAM_USER")) badges.push(emojis.badges.team_user);
    if (userBadges.includes("BUGHUNTER_LEVEL_1"))
      badges.push(emojis.badges.bughunter_lv1);
    if (userBadges.includes("BUGHUNTER_LEVEL_2"))
      badges.push(emojis.badges.bughunter_lv2);
    if (userBadges.includes("CERTIFIED_MODERATOR"))
      badges.push(emojis.badges.moderator);
    if (userBadges.includes("EARLY_SUPPORTER"))
      badges.push(emojis.badges.early_supporter);
    if (userBadges.includes("HYPESQUAD_EVENTS"))
      badges.push(emojis.badges.hypesquad);
    if (userBadges.includes("HOUSE_BRILLIANCE"))
      badges.push(emojis.badges.brilliance);
    if (userBadges.includes("HOUSE_BRAVERY"))
      badges.push(emojis.badges.bravery);
    if (userBadges.includes("HOUSE_BALANCE"))
      badges.push(emojis.badges.balance);
    if (userBadges.includes("ACTIVE_DEVELOPER"))
      badges.push(emojis.badges.active_developer);
    if (userBadges.includes("VERIFIED_BOT"))
      badges.push(emojis.badges.verified_bot);
    if (userBadges.includes("EARLY_VERIFIED_BOT_DEVELOPER"))
      badges.push(emojis.badges.early_verified_bot_developer);
  }

  if (
    !user.discriminator ||
    user.discriminator === "0" ||
    user.tag === `${user.username}#0`
  ) {
    badges.push(emojis.badges.newuser);
  }

  if (!badges.length) {
    badges.push("No badges found.");
  }

  return badges.join(" ");
}
