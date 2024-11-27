import reply from "../../functions/reply";
import logging from "../../models/utility/logging";
import { Command } from "../../structures/Command";
import {
  ApplicationCommandOptionType,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType,
  ComponentType,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export default new Command({
  name: "logging",
  description: "Log events that happen in your server.",
  userPermissions: ["ManageGuild"],
  clientPermissions: ["ViewAuditLog", "ManageChannels"],
  options: [
    {
      name: "enable",
      description: "Enable the logging system.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "channel",
          description: "The channel you want logs to be sent to.",
          required: true,
          type: ApplicationCommandOptionType.Channel,
          channelTypes: [ChannelType.GuildText],
        },
      ],
    },
    {
      name: "edit",
      description: "Edit what events are logged.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "disable",
      description: "Disable the logging system.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  run: async ({ interaction, guild, opts, client }) => {
    const sub = opts.getSubcommand();
    const channel = opts.getChannel("channel");

    const options = [
      {
        label: "Log Member Events",
        description: "Log all member-related events (ban/kick/leave etc)",
        value: "logmember",
      },
      {
        label: "Log Channel Events",
        description: "Log all channel-related events (delete/edit/join etc)",
        value: "logchannel",
      },
      {
        label: "Log Server Events",
        description: "Log all server-related events (edit)",
        value: "logserver",
      },
    ];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("logging-selection")
      .setMaxValues(3)
      .setOptions(
        options.map((opt) =>
          new StringSelectMenuOptionBuilder()
            .setDescription(opt.description)
            .setLabel(opt.label)
            .setValue(opt.value)
        )
      )
      .setPlaceholder("Select a logging option below...");

    const selectRow =
      new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(selectMenu);

    const confirmRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId("confirm-log")
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Success)
    );

    switch (sub) {
      case "enable":
        {
          const validch = await guild.channels.cache.get(channel.id);
          if (!validch) throw "That is not a valid channel in this server.";

          if (validch.permissionsFor(guild.roles.everyone).has("ViewChannel"))
            throw "You cannot use a channel where everybody can see the logs.";

          const selected = [];

          const logSys = await logging.findOne({ Guild: guild.id });
          if (logSys)
            throw "The logging system must be altered through /logging edit, the logging system is already enabled.";

          const msg = await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setTitle(`Logging System - wave:tm:`)
                .setDescription(
                  `Select an option below as to what kind of logging you want.\n*The description of the options describes what will be logged.*\n\n**Once you have selected your options, press the Confirm button.**`
                )
                .setThumbnail(guild.iconURL())
                .setColor("Aqua"),
            ],
            components: [selectRow, confirmRow],
            ephemeral: true,
          });

          const collector = await msg.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id,
            componentType: ComponentType.StringSelect,
          });

          collector.on("collect", async (i) => {
            i.deferUpdate();
            const value = i.values[0];

            switch (value) {
              case "logmember":
                {
                  if (selected.includes("logmember")) {
                    return;
                  }
                  selected.push("logmember");
                }
                break;

              case "logchannel":
                {
                  if (selected.includes("logchannel")) {
                    return;
                  }
                  selected.push("logchannel");
                }
                break;

              case "logserver":
                {
                  if (selected.includes("logserver")) {
                    return;
                  }
                  selected.push("logserver");
                }
                break;
            }
          });

          const buttonCollector = await msg.createMessageComponentCollector({
            filter: (int) => int.user.id === interaction.user.id,
            componentType: ComponentType.Button,
          });

          buttonCollector.on("collect", async (int) => {
            if (int.customId === "confirm-log") {
              if (selected.length <= 0)
                return int.reply({
                  content: `No logging options were selected.`,
                  ephemeral: true,
                  fetchReply: true,
                });

              const existsSys = await logging.findOne({ Guild: guild.id });
              if (existsSys)
                return int.reply({
                  content: `You have already confirmed.`,
                  ephemeral: true,
                  fetchReply: true,
                });

              await logging.create({
                Guild: guild.id,
                ActionsLogged: selected,
                LogChannel: validch.id,
              });

              return int.reply({
                content: `All logging options saved.\n**Selected Options:**\n> *${selected.join(
                  "\n"
                )}*`,
                ephemeral: true,
                fetchReply: true,
              });
            } else return;
          });
        }
        break;

      case "edit":
        {
        }
        break;

      case "disable":
        {
          const logSys = await logging.findOne({ Guild: guild.id });
          if (!logSys) throw "The logging system is already disabled.";

          await logSys.deleteOne();

          return reply(
            interaction,
            `The logging system has been disabled.`,
            false,
            ""
          );
        }
        break;
    }
  },
});
