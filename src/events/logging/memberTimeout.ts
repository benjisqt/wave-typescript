import { Event } from "../../structures/Event";
import logging from "../../models/utility/logging";
import { EmbedBuilder } from "discord.js";

export default new Event("guildMemberUpdate", async (oldM, newM) => {
  const oldTimeout = oldM.communicationDisabledUntilTimestamp;
  const newTimeout = newM.communicationDisabledUntilTimestamp;

  if (oldTimeout === newTimeout) return;

  const LS = await logging.findOne({ Guild: newM.guild.id });
  if (!LS) return;

  const LC = LS ? await newM.guild.channels.cache.get(LS.LogChannel) : null;

  const action = newTimeout ? "Added" : "Expired";

  const timeoutDuration = newTimeout
    ? Math.round((newTimeout - Date.now()) / 1000) // in seconds
    : null;

  const embed = new EmbedBuilder()
    .setTitle(`Member Timeout ${action}`)
    .setDescription(
      `A member in this server ${
        action === "Added"
          ? `has been timed out for **${timeoutDuration} seconds**.`
          : "no longer has a timeout."
      }`
    )
    .setColor(action === "Added" ? "Red" : "Green")
    .setThumbnail(newM.displayAvatarURL())
    .setAuthor({
      name: `${newM.user.tag}`,
      iconURL: `${newM.displayAvatarURL()}`,
    });

  if (LC && LC.isSendable()) {
    LC.send({ embeds: [embed] });
  }
});
