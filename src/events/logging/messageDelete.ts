import { Event } from "../../structures/Event";
import logging from "../../models/utility/logging";
import { EmbedBuilder } from "discord.js";

export default new Event("messageDelete", async (m) => {
  const LS = await logging.findOne({ Guild: m.guild.id });
  if (!LS) return;

  const LC = LS ? await m.guild.channels.cache.get(LS.LogChannel) : null;

  if (!LS.ActionsLogged.includes("logmember")) return;

  if (LC && LC.isSendable()) {
    LC.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`Message Deleted`)
          .setDescription(`A message has been deleted in this server.`)
          .setAuthor({
            name: `${m.member.user.tag}`,
            iconURL: `${m.member.displayAvatarURL()}`,
          })
          .setColor("Aqua")
          .setFields(
            {
              name: `Message Author:`,
              value: `<@${m.author.id}>`,
              inline: true,
            },
            { name: `Message Content:`, value: `${m.content}`, inline: true },
            { name: `Channel:`, value: `<#${m.channel.id}>`, inline: true }
          ),
      ],
    });
  } else return;
});
