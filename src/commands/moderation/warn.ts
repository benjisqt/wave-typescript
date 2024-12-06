import { Command } from "../../structures/Command";
import warnLimits from "../../models/moderation/warn-limits";
import cases from "../../models/moderation/cases";
import logging from "../../models/utility/logging";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ComponentType,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

export default new Command({
  name: "warn",
  description: "Warn a user.",
  userPermissions: ["BanMembers"],
  clientPermissions: ["BanMembers"],
  options: [
    {
      name: "add",
      description: "Add a warning to a user.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "user",
          description: "The user you want to warn.",
          type: ApplicationCommandOptionType.User,
          required: true,
        },
        {
          name: "reason",
          description: "The reason for warning the user.",
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
      name: "settings",
      description: "Adjust the settings of the warning system.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  run: async ({ interaction, guild, opts }) => {
    const sub = opts.getSubcommand();
    const user = opts.getUser("user") || interaction.user;
    const reason = opts.getString("reason") || "No reason provided.";
    const silent = opts.getBoolean("silent") || false;

    const member = guild.members.cache.get(user.id);
    if (!member) throw "That member is not in this server.";

    const LS = await logging.findOne({ Guild: guild.id });
    const logChannel = LS
      ? await guild.channels.cache.get(LS.LogChannel)
      : null;

    if (sub === "add") {
      if (member.id === interaction.member.id) throw "You can't warn yourself.";

      await cases.create({
        Guild: guild.id,
        Moderator: interaction.member.id,
        Reason: reason,
        Type: `Warning`,
        User: member.id,
      });

      const WL = await warnLimits.findOne({ Guild: guild.id });
      if (WL) {
        const allWarns = await cases.find({ Guild: guild.id, User: member.id });
        if (allWarns.length >= WL.WarnLimit) {
          try {
            await member.kick();
          } catch (err) {
            return interaction.reply({
              content: `I need the Kick Members permission to do this.\nEither that or the member has a higher role position than me.`,
            });
          }

          allWarns.forEach(async (warning) => {
            await warning.deleteOne();
          });

          await cases.create({
            Guild: guild.id,
            Moderator: interaction.user.id,
            Reason: `Reached warning limit of ${WL.WarnLimit}`,
            Type: `Kick`,
            User: member.id,
          });

          const embed = new EmbedBuilder()
            .setTitle(`Member Kicked`)
            .setDescription(
              `*A member has been kicked due to them having too many warnings.*\n**Their warnings have been reset to 0.**`
            )
            .setColor("Aqua")
            .setThumbnail(member.displayAvatarURL());

          if (logChannel && logChannel.isSendable()) {
            logChannel.send({ embeds: [embed] });
          }

          return interaction.reply({
            embeds: [embed],
            ephemeral: silent,
          });
        }
      }

      const embed = new EmbedBuilder()
        .setTitle(`Warning Given`)
        .setDescription(`*A warning has been given to a user.*`)
        .setFields(
          { name: `User`, value: `<@${member.id}>`, inline: true },
          {
            name: `Moderator`,
            value: `<@${interaction.member.id}>`,
            inline: true,
          },
          { name: `Reason`, value: `${reason}`, inline: true }
        )
        .setColor("Aqua")
        .setThumbnail(member.displayAvatarURL());

      if (logChannel && logChannel.isSendable()) {
        logChannel.send({ embeds: [embed] });
      }

      return interaction.reply({ embeds: [embed], ephemeral: silent });
    } else if (sub === "settings") {
      const options = {
        label: "Adjust Warning Limit",
        value: "warnlimit",
        description:
          "Adjust the limit for how many warnings a user can get before punishment.",
      };

      const selMenu = new StringSelectMenuBuilder()
        .setOptions(options)
        .setCustomId("selwarn")
        .setPlaceholder("Select an option below:");

      const embed = new EmbedBuilder()
        .setTitle(`Warn Settings`)
        .setDescription(`*Select any option below to adjust warning settings.`)
        .setColor("Aqua")
        .setThumbnail(guild.iconURL());

      const msg = await interaction.reply({
        embeds: [embed],
        components: [
          new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
            selMenu
          ),
        ],
      });

      const collector = await msg.createMessageComponentCollector({
        filter: (i) => i.user.id === interaction.user.id,
        componentType: ComponentType.StringSelect,
        max: 1,
      });

      collector.on("collect", async (i) => {
        if (i.customId === "selwarn") {
          const selection = i.values[0];
          if (selection === "warnlimit") {
            await i.reply({
              content: `Please send a message below with the warning limit. (0: No punishments no matter how many warnings)`,
              ephemeral: true,
            });

            const c = await i.channel.createMessageCollector({
              filter: (m) => m.author.id === i.user.id,
              max: 1,
            });

            c.on("collect", async (m) => {
              if (isNaN(parseInt(m.content))) {
                m.reply({ content: `That is not a valid number. Try again.` });
                collector.stop();
                c.stop();
              } else {
                const WL = await warnLimits.findOne({ Guild: guild.id });

                const embedString = WL
                  ? `The warning limit has been changed to ${m.content} warnings until a kick.`
                  : `The warning limit has been set to ${m.content} warnings until a kick.`;

                if (!WL) {
                  warnLimits.create({
                    Guild: guild.id,
                    WarnLimit: parseInt(m.content),
                  });
                } else {
                  WL.WarnLimit = parseInt(m.content);
                  await WL.save();
                }

                m.delete();
                msg.edit({
                  embeds: [
                    new EmbedBuilder()
                      .setTitle(`Warning Limit Changed`)
                      .setDescription(embedString)
                      .setColor("Aqua")
                      .setThumbnail(guild.iconURL()),
                  ],
                  components: [],
                });
              }
            });

            c.on("end", async (r) => {});
          } else return;
        } else return;
      });

      collector.on("end", async (r) => {
        selMenu.setDisabled(true);
      });
    }
  },
});
