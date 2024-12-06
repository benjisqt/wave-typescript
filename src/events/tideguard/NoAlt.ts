import { Event } from "../../structures/Event";
import tideguard from "../../models/tideguard/tideguard";

export default new Event("guildMemberAdd", async (member) => {
  const TG = await tideguard.findOne({ Guild: member.guild.id });
  if (!TG?.NoAlt?.Enabled) return;

  if (member.user.displayName.includes("alt")) {
    const howLongAgo = Math.floor(member.user.createdTimestamp - Date.now());
    const threshold = Math.floor(TG.NoAlt.MaxDays * 86400000);

    if (howLongAgo > threshold) return;

    if (TG.NoAlt.Punishment === "ban") {
      try {
        member.ban({ reason: `NoAlt (Member Banned); wave.` });
      } catch (err) {}
    } else if (TG.NoAlt.Punishment === "kick") {
      try {
        member.kick(`NoAlt (Member Kicked); wave.`);
      } catch (err) {}
    }
  }

  const howLongAgo = Math.floor(Date.now() - member.user.createdTimestamp);
  const threshold = Math.floor(TG.NoAlt.MaxDays * 86400000);

  if (howLongAgo > threshold) return;

  if (TG.NoAlt.Punishment === "ban") {
    try {
      member.ban({ reason: `NoAlt (Member Banned); wave.` });
    } catch (err) {}
  } else if (TG.NoAlt.Punishment === "kick") {
    try {
      member.kick(`NoAlt (Member Kicked); wave.`);
    } catch (err) {}
  }
});
