import { Event } from "../../structures/Event";
import tideguard from "../../models/tideguard/tideguard";
import logging from "../../models/utility/logging";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import cases from "../../models/moderation/cases";

export default new Event("messageDelete", async (m) => {
  if (m.author.bot) return;
  if (!m.mentions || !m.mentions.members || m.mentions.members.size <= 0)
    return;

  if (m.mentions.members.size > 0) {
    const TG = await tideguard.findOne({ Guild: m.guild.id });
    const LS = await logging.findOne({ Guild: m.guild.id });

    const closeButton = new ButtonBuilder()
      .setCustomId("close")
      .setLabel("Close")
      .setStyle(ButtonStyle.Danger);

    const closeRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
      closeButton
    );

    const embed = new EmbedBuilder()
      .setDescription(
        `<@${m.author.id}>, do not ghost ping in this server!\n*A warning has been given to you.*`
      )
      .setColor("Red");

    const logEmbed = new EmbedBuilder()
      .setDescription(
        `<@${
          m.author.id
        }> has received a warning for ghost pinging <@${m.mentions.members.first()}>.`
      )
      .setColor("Red");

    if (TG) {
      if (TG.NoGhost?.Enabled) {
        const LC = LS ? await m.guild.channels.cache.get(LS.LogChannel) : null;

        if (LC && LC.isSendable()) {
          LC.send({
            embeds: [logEmbed],
          });
        }

        await cases.create({
          Guild: m.guild.id,
          User: m.author.id,
          Moderator: m.guild.members.me.id,
          Reason: "NoGhost; GhostPing detected.",
          Type: "Warning",
        });

        return m.channel.send({ embeds: [embed], components: [closeRow] });
      } else return;
    } else return;
  } else return;
});
