import { Event } from "../../structures/Event";
import logging from "../../models/utility/logging";
import { EmbedBuilder } from "discord.js";

export default new Event("messageUpdate", async (oldMsg, newMsg) => {
  if (oldMsg.content === newMsg.content) return;
  const LS = await logging.findOne({ Guild: newMsg.guild.id });
  if (!LS) return;

  const LC = LS ? await newMsg.guild.channels.cache.get(LS.LogChannel) : null;

  if (!LS.ActionsLogged.includes("logmember")) return;

  if (LC && LC.isSendable()) {
    LC.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`Message Edited`)
          .setDescription(`A message has been edited in this server.`)
          .setAuthor({
            name: `${newMsg.member.user.tag}`,
            iconURL: `${newMsg.member.displayAvatarURL()}`,
          })
          .setColor("Aqua")
          .setFields(
            {
              name: `Message Author:`,
              value: `<@${newMsg.author.id}>`,
              inline: true,
            },
            {
              name: `Channel:`,
              value: `<#${newMsg.channel.id}>`,
              inline: true,
            },
            {
              name: `Old Message Content:`,
              value: `${oldMsg.content}`,
            },
            {
              name: `New Message Content:`,
              value: `${newMsg.content}`,
              inline: true,
            }
          ),
      ],
    });
  } else return;
});
