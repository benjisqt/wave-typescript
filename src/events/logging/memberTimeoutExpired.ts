import { Event } from "../../structures/Event";
import logging from "../../models/utility/logging";
import tempTimeout from "../../models/moderation/tempTimeout";
import { Client, EmbedBuilder } from "discord.js";

export default new Event("ready", async (c) => {
  setInterval(() => checkTimeouts(c), 30000);
});

const checkTimeouts = async (client: Client) => {
  const guilds = client.guilds.cache;

  for (const [guildId, guild] of guilds) {
    try {
      const LS = await logging.findOne({ Guild: guildId });
      if (!LS) continue;

      const LC = guild.channels.cache.get(LS.LogChannel);
      if (!LC || !LC.isTextBased()) continue;

      const members = await guild.members.fetch();
      members.forEach(async (m) => {
        const timeoutUntil = m.communicationDisabledUntilTimestamp;

        if (timeoutUntil && timeoutUntil <= Date.now()) {
          const TT = await tempTimeout.findOne({
            Guild: m.guild.id,
            User: m.user.id,
          });
          if (!TT) return;
          const embed = new EmbedBuilder()
            .setTitle(`Member Timeout Expired`)
            .setDescription(
              `${m.user.tag}'s timeout has expired automatically.`
            )
            .setColor("Green")
            .setThumbnail(m.displayAvatarURL())
            .setAuthor({
              name: `${m.user.tag}`,
              iconURL: `${m.displayAvatarURL()}`,
            });

          await TT.deleteOne();

          LC.send({ embeds: [embed] });
        }
      });
    } catch (err) {}
  }
};
