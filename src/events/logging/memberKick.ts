import { Event } from "../../structures/Event";
import logging from "../../models/utility/logging";
import { AuditLogEvent, EmbedBuilder } from "discord.js";

export default new Event("guildMemberRemove", async (m) => {
  try {
    const audit = await m.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberKick,
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
              .setTitle(`Member Kick`)
              .setDescription(`A member has been kicked from the server.`)
              .setFields(
                {
                  name: `Member Kicked`,
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
