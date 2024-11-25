import { ApplicationCommandOptionType, ChannelType } from "discord.js";
import levelingServer from "../../models/utility/leveling-server";
import reply from "../../functions/reply";
import { Command } from "../../structures/Command";

export default new Command({
  name: "leveling-server",
  description: "Configure the leveling system in your server.",
  devOnly: true,
  userPermissions: ["ManageGuild"],
  clientPermissions: ["ManageRoles"],
  options: [
    {
      name: "enable",
      description: "Enable the leveling system in your server.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "channel",
          description: "The channel you want leveling messages to be sent to.",
          type: ApplicationCommandOptionType.Channel,
          channelTypes: [ChannelType.GuildText],
          required: true,
        },
        {
          name: "difficulty",
          description: "Change how difficult it is for users to gain levels.",
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name: "1.5x more difficult",
              value: "1.5x",
            },
            {
              name: "2x more difficult",
              value: "2x",
            },
            {
              name: "2.5x more difficult",
              value: "2.5x",
            },
          ],
        },
        {
          name: "command-xp",
          description:
            "Do you want users to gain XP when they run commands through wave?",
          type: ApplicationCommandOptionType.Boolean,
        },
      ],
    },
    {
      name: "disable",
      description: "Disable the leveling system in your server.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "add-level-reward",
      description: "Give users a reward when they reach a certain level.",
      type: ApplicationCommandOptionType.Subcommand,
    },
    {
      name: "remove-level-reward",
      description: "Remove a reward that users would be able to unlock.",
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "level",
          description: "The level that the reward would be given on.",
          required: true,
          type: ApplicationCommandOptionType.Integer,
        },
      ],
    },
    {
      name: "check-level-rewards",
      description: "Check all level rewards given to users.",
      type: ApplicationCommandOptionType.Subcommand,
    },
  ],

  run: async ({ interaction, guild, opts, client }) => {
    const channel = opts.getChannel("channel");
    const difficulty = opts.getString("difficulty");
    const cmdxp = opts.getBoolean("command-xp");
    const level = opts.getInteger("level");
    const lvS = await levelingServer.findOne({ Guild: guild.id });

    const sub = opts.getSubcommand();
    switch (sub) {
      case "enable":
        {
          if (lvS) throw "The leveling system is already enabled.";

          let diff;
          const validch = await guild.channels.cache.get(channel.id);
          if (!validch) throw "That is not a valid channel in this server.";

          if (!validch.permissionsFor(client.user).has("SendMessages"))
            throw "I do not have permissions to send messages in that channel.";

          if (difficulty === "1.5x") diff = 1.5;
          else if (difficulty === "2x") diff = 2;
          else if (difficulty === "2.5x") diff = 2.5;
          else diff = 1;

          await levelingServer.create({
            Guild: guild.id,
            CommandXP: cmdxp,
            Difficulty: diff,
            LevelRewards: [],
            LevelRewardUnlock: [],
            LevelChannel: validch.id,
          });

          return reply(
            interaction,
            `The leveling system has been disabled.\n**Difficulty: ${diff}x**\n**Command XP:** ${cmdxp}`,
            false,
            ""
          );
        }
        break;

      case "disable":
        {
          if (!lvS) throw "The leveling system is disabled.";

          await lvS.deleteOne();

          return reply(
            interaction,
            `The leveling system has been disabled.`,
            false,
            ""
          );
        }
        break;

      case "add-level-reward":
        {
          if (!lvS) throw "The leveling system is disabled.";
        }
        break;

      case "remove-level-reward":
        {
        }
        break;

      case "check-level-rewards":
        {
        }
        break;
    }
  },
});
