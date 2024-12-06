import { Event } from "../../structures/Event";
import tideguard from "../../models/tideguard/tideguard";

export default new Event("interactionCreate", async (i) => {
  if (!i.isStringSelectMenu()) return;

  if (i.customId !== "tideguard") return;

  const TG = await tideguard.findOne({ Guild: i.guild.id });

  const selection = i.values[0];

  if (selection === "noalt") {
    if (TG) {
      if (TG.NoAlt.Enabled) {
        TG.NoAlt.Enabled = false;
        await TG.save();

        return i.reply({
          content: `NoAlt system disabled!`,
          ephemeral: true,
        });
      }
    }

    await i.reply({
      content: `Please name a punishment for detected alts.\n(**ban/kick**)`,
      ephemeral: true,
    });

    const collector = i.channel.createMessageCollector({
      filter: (m) => m.author.id === i.user.id,
      time: 60000,
    });

    if (!collector) return;

    let step = 1;

    let punishment;
    let maxD;

    collector.on("collect", async (m) => {
      const response = m.content.trim().toLowerCase();

      switch (step) {
        case 1:
          if (!["ban", "kick"].includes(response)) {
            return m.reply({
              content: `Invalid input. Please type **ban** or **kick**.`,
            });
          }

          punishment = response;

          await m.reply({
            content: `Punishment set to **${response}**.\n*Now, please specify the maximum account age in days. (1-15)*`,
          });

          step = 2;
          break;

        case 2:
          const maxDays = parseInt(response, 10);

          if (isNaN(maxDays) || maxDays < 1 || maxDays > 15) {
            return m.reply({
              content: `Invalid input. Please enter a number between **1 and 15.**`,
            });
          }

          maxD = maxDays;

          await m.reply({
            content: `Max days set to **${maxDays}**.\n*NoAlt system enabled!*\n\n*Thank you for choosing wave TideGuard.*`,
          });

          if (TG) {
            TG.NoAlt.Enabled = true;
            TG.NoAlt.Punishment = punishment;
            TG.NoAlt.MaxDays = maxD;
            await TG.save();
          } else {
            await tideguard.create({
              Guild: i.guild.id,
              NoAlt: {
                Enabled: true,
                Punishment: punishment,
                MaxDays: maxD,
              },
              NoGhost: {
                Enabled: false,
              },
              NoSpam: {
                Enabled: false,
                MessageLimit: 0,
              },
            });
          }
          collector.stop();
          break;
      }
    });
  } else if (selection === "noghost") {
    if (!TG || !TG.NoGhost) {
      await tideguard.create({
        Guild: i.guild.id,
        NoAlt: {
          Enabled: false,
          Punishment: "",
          MaxDays: 0,
        },
        NoGhost: {
          Enabled: true,
        },
        NoSpam: {
          Enabled: false,
          MessageLimit: 0,
        },
      });
    } else if (TG && !TG.NoGhost) {
      TG.NoGhost.Enabled = true;
      await TG.save();
    }

    return i.reply({
      content: `NoGhost Enabled.\n*Ghost pings will now be punished where possible.*`,
      ephemeral: true,
    });
  } else if (selection === "nospam") {
    if (TG) {
      if (TG.NoSpam.Enabled) {
        TG.NoSpam.Enabled = false;
        await TG.save();

        return i.reply({
          content: `NoSpam system disabled!`,
          ephemeral: true,
        });
      }
    }

    await i.reply({
      content: `Please name a message limit for the NoSpam to trigger.`,
      ephemeral: true,
    });

    const collector = i.channel.createMessageCollector({
      filter: (m) => m.author.id === i.user.id,
      time: 60000,
    });

    if (!collector) return;

    let step = 1;

    collector.on("collect", async (m) => {
      const response = m.content.trim().toLowerCase();
      const maxMessages = parseInt(response, 10);

      switch (step) {
        case 1:
          if (isNaN(maxMessages) || maxMessages > 10) {
            return m.reply({
              content: `That is either not a number or the message limit has been set above 10.`,
            });
          }

          await m.reply({
            content: `NoSpam enabled.\nThe filter will trigger when a user sends more than ${maxMessages} messages consecutively.`,
          });

          if (TG) {
            TG.NoSpam.Enabled = true;
            TG.NoSpam.MessageLimit = maxMessages;
            await TG.save();
          } else {
            await tideguard.create({
              Guild: i.guild.id,
              NoSpam: {
                Enabled: true,
                MessageLimit: maxMessages,
              },
              NoAlt: {
                Enabled: false,
                Punishment: "",
                MaxDays: 0,
              },
              NoGhost: {
                Enabled: false,
              },
            });
          }
          collector.stop();
          break;
      }
    });
  }
});
