import { Event } from "../../structures/Event";
import leveling from "../../models/utility/leveling";
import levelingServer from "../../models/utility/leveling-server";
import calculate from "../../functions/calculateLevelUp";
import getXP from "../../functions/getXP";
import { EmbedBuilder } from "discord.js";

const cooldowns = new Set();

export default new Event("messageCreate", async (message) => {
  await message.guild.fetchOwner();

  if (!message.inGuild() || message.author.bot) return;

  const lvS = await levelingServer.findOne({ Guild: message.guild.id });
  if (!lvS) return;

  if (cooldowns.has(message.author.id)) return;

  cooldowns.add(message.author.id);

  const xp = getXP(5, 20);

  let ch;
  const channel = await message.guild.channels.cache.get(lvS.LevelChannel);
  if (!channel) ch = message.channel;
  else ch = channel;

  const profile = await leveling.findOne({
    Guild: message.guild.id,
    User: message.author.id,
  });

  if (!profile) {
    await leveling.create({
      Guild: message.guild.id,
      Level: 1,
      User: message.author.id,
      XP: xp,
    });
  } else {
    if (profile.XP > calculate(profile.Level, lvS.Difficulty)) {
      profile.XP = 0;
      profile.Level += 1;

      await profile.save();

      return ch.send({
        embeds: [
          new EmbedBuilder()
            .setDescription(
              `<@${message.member.id}> has leveled up to **Level ${profile.Level}**!\n<@${message.guild.ownerId}> would be proud!`
            )
            .setColor("Aqua")
            .setThumbnail(message.member.displayAvatarURL())
            .setTimestamp(),
        ],
      });
    } else {
      profile.XP += xp;
      await profile.save();
    }
  }
});
