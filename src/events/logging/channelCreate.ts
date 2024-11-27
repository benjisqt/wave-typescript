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
          { name: `Channel Name`, value: `${c.name}` },
          {
            name: `Channel Created`,
            value: `<t:${Math.round(
              c.createdTimestamp / 1000
            )}:d> (<t:${Math.round(c.createdTimestamp / 1000)}:R>)`,
          },
          {
            name: `Channel Type`,
            value: `${c.type.toString()}`,
          },
          {
            name: `Roles visible`,
            value: `${vr.join("\n") || "None."}`,
          }
        )
        .setColor("Aqua")
        .setFooter({ text: `wave, by Aurion Development.` }),
    ],
  });
});
