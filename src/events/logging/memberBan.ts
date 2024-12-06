import { Event } from "../../structures/Event";
import logging from "../../models/utility/logging";
import { AuditLogEvent, EmbedBuilder } from "discord.js";

export default new Event("guildMemberRemove", async (m) => {
  try {
    const audit = await m.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberBanAdd,
      user: m.user,
    });

    if (audit.entries.size) {
      const entry = audit.entries.at(0);
      const LS = await logging.findOne({ Guild: m.guild.id });
      if (!LS) return;

      const LC = await m.guild.channels.cache.get(LS.LogChannel);

      if (LC && LC.isSendable()) {
        LC.send({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Member Ban`)
              .setDescription(`A member has been banned from the server.`)
              .setFields(
                {
                  name: `Member Banned`,
                  value: `${entry.target.tag}`,
                  inline: true,
                },
                {
                  name: `Moderator`,
                  value: `${entry.executor.tag}`,
                  inline: true,
                },
                {
                  name: `Time & Date`,
                  value: `<t:${Math.round(entry.createdTimestamp / 1000)}:>`,
                  inline: true,
                },
                {
                  name: `Reason`,
                  value: `${entry.reason}`,
                  inline: true,
                }
              )
              .setColor("Aqua")
              .setThumbnail(entry.target.displayAvatarURL()),
          ],
        });
      } else return;
    } else return;
  } catch (err) {
    return;
  }
});
