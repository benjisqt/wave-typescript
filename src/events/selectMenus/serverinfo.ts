import { ChannelType, EmbedBuilder } from "discord.js";
import { Event } from "../../structures/Event";

export default new Event("interactionCreate", async (i) => {
  if (!i.isStringSelectMenu()) return;

  if (i.customId !== "serverinfo") return;

  const value = i.values[0];

  const hiddenChannels = i.guild.channels.cache.filter(
    (c) => !c.permissionsFor(i.guild.roles.everyone).has("ViewChannel")
  );

  switch (value) {
    case "channelinfo":
      {
        return i.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Server Info - Channels`)
              .setColor("Aqua")
              .setThumbnail(i.guild.iconURL())
              .setFields(
                {
                  name: `Total Channel Count`,
                  value: `${i.guild.channels.cache.size} Channels`,
                  inline: true,
                },
                {
                  name: `Hidden Channels`,
                  value: `${hiddenChannels.size}`,
                  inline: true,
                },
                {
                  name: `AFK Channel?`,
                  value: `${
                    i.guild.afkChannel
                      ? `<#${i.guild.afkChannel.id}>`
                      : `Not assigned.`
                  }`,
                  inline: true,
                }
              ),
          ],
        });
      }
      break;

    case "allinfo":
      {
        const moderators = i.guild.roles.cache.filter((r) =>
          r.permissions.has("ModerateMembers")
        );

        const onlineMembers = i.guild.members.cache.filter(
          (m) => m.presence?.status === "online"
        );
        const dndMembers = i.guild.members.cache.filter(
          (m) => m.presence?.status === "dnd"
        );
        const offlineMembers =
          i.guild.members.cache.filter((m) => m.presence?.status === "offline")
            .size + i.guild.members.cache.filter((m) => !m.presence).size;

        return i.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`All Server Info - ${i.guild.name}`)
              .setColor("Aqua")
              .setThumbnail(i.guild.iconURL())
              .setFields(
                {
                  name: `Channel Info`,
                  value: `🤫 **Hidden Channels:** ${
                    hiddenChannels.size
                  }\n#️⃣ **All Text Channels:** ${
                    i.guild.channels.cache.filter(
                      (t) => t.type === ChannelType.GuildText
                    ).size
                  }\n🔊 **All Voice Channels:** ${i.guild.channels.cache.filter(
                    (t) => t.type === ChannelType.GuildVoice
                  )}`,
                  inline: true,
                },
                {
                  name: `Role Info`,
                  value: `👨‍💼 **Moderator Roles:** ${moderators.size}\n👥 **All Roles:** ${i.guild.roles.cache.size}\n⬆️ **Highest Role:** <@&${i.guild.roles.highest.id}>`,
                  inline: true,
                },
                {
                  name: `Member Activities`,
                  value: `🔴 **Do Not Disturb:** ${dndMembers.size}\n🟢 **Online Members:** ${onlineMembers.size}\n⚫ **Offline Members:** ${offlineMembers}`,
                  inline: true,
                },
                {
                  name: `Server Owner`,
                  value: `<@${i.guild.ownerId}>`,
                  inline: true,
                },
                {
                  name: `Member Count`,
                  value: `${i.guild.memberCount} members\n${
                    i.guild.members.cache.filter((m) => !m.user.bot).size
                  } humans\n${
                    i.guild.members.cache.filter((m) => m.user.bot).size
                  } bots`,
                  inline: true,
                },
                {
                  name: `Server Boosting`,
                  value: `**Boost Tier:** ${i.guild.premiumTier}\n**Boosts:** ${i.guild.premiumSubscriptionCount}`,
                  inline: true,
                }
              ),
          ],
        });
      }
      break;

    case "membercount":
      {
        return i.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Member Count - ${i.guild.name}`)
              .setDescription(
                `**${
                  i.guild.members.cache.size
                }** Members\n**${i.guild.members.cache.filter(
                  (m) => !m.user.bot
                )}** Users\n**${
                  i.guild.members.cache.filter((m) => m.user.bot).size
                }** Bots`
              )
              .setColor("Aqua")
              .setThumbnail(i.guild.iconURL()),
          ],
        });
      }
      break;

    case "roles":
      {
        const administrators = await i.guild.roles.cache.filter((r) =>
          r.permissions.has("Administrator")
        ).size;
        const memberRoles = await i.guild.roles.cache.filter(
          (r) => !r.permissions.has("ModerateMembers")
        ).size;
        const moderators = await i.guild.roles.cache.filter((r) =>
          r.permissions.has("ModerateMembers")
        ).size;

        return i.reply({
          embeds: [
            new EmbedBuilder()
              .setTitle(`Roles - ${i.guild.name}`)
              .setDescription(
                `**Administrators:** ${administrators}\n**Member Roles:** ${memberRoles}\n**Moderators:** ${moderators}`
              )
              .setColor("Aqua")
              .setThumbnail(i.guild.iconURL()),
          ],
        });
      }
      break;
  }
});
