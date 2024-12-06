import { Event } from "../../structures/Event";
import logging from "../../models/utility/logging";
import { AuditLogEvent, ChannelType, EmbedBuilder } from "discord.js";

export default new Event("channelCreate", async (c) => {
  const logSys = await logging.findOne({ Guild: c.guild.id });
  if (!logSys) return;

  const channel = await c.guild.channels.cache.get(logSys.LogChannel);
  if (!channel) {
    if (c.type === ChannelType.GuildText) {
      try {
        c.send({
          content: `**Notice:** The logging system channel is not valid. Please re-enable the logging system.`,
        });
      } catch (err) {
        return;
      }
    }
  }

  try {
    if (channel.type !== ChannelType.GuildText) return;

    const audit = await c.guild.fetchAuditLogs();
    const auditEntry = audit.entries.find(
      (a) => a.action === AuditLogEvent.ChannelCreate
    );

    let vr = [];
    const visibleRoles = c.permissionOverwrites.cache.filter((po) =>
      po.allow.has("SendMessages")
    );
    if (visibleRoles.size > 0) {
      visibleRoles.forEach(async (v) => {
        vr.push(`<@&${v}>`);
      });
    }

    channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle(`Channel Created`)
          .setAuthor({
            name: `${auditEntry.executor.tag}`,
            iconURL: `${auditEntry.executor.displayAvatarURL()}`,
          })
          .setFields(
            { name: `Channel Name:`, value: `${c.name}`, inline: true },
            {
              name: `Channel Created:`,
              value: `<t:${Math.round(
                c.createdTimestamp / 1000
              )}:> (<t:${Math.round(c.createdTimestamp / 1000)}:R>)`,
              inline: true,
            },
            {
              name: `Channel Type:`,
              value: `${c.type}`,
              inline: true,
            },
            {
              name: `Roles Visible:`,
              value: `${vr.join("\n") || "None."}`,
              inline: true,
            }
          )
          .setColor("Aqua")
          .setFooter({ text: `wave, by Aurion Development.` }),
      ],
    });
  } catch (err) {
    if (c.type === ChannelType.GuildText) {
      try {
        c.send({
          content: `**Notice:** The logging system channel is not valid. Please re-enable the logging system.`,
        });
      } catch (err) {
        return;
      }
    }
  }
});
