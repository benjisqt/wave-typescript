import { Command } from "../../structures/Command";
import {
  ApplicationCommandOptionType,
  ChannelType,
  EmbedBuilder,
} from "discord.js";
import ms from "ms";

export default new Command({
  name: "slowmode",
  description: "Set the slowmode for a channel.",
  clientPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],
  options: [
    {
      name: "duration",
      description: "The duration of the slowmode (e.g. 5s, 2h)",
      type: ApplicationCommandOptionType.String,
      required: true,
    },
    {
      name: "channel",
      description: "The channel you want to set the slowmode for.",
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildText],
    },
  ],

  run: async ({ interaction, guild, opts }) => {
    const d = opts.getString("duration");
    const channel = opts.getChannel("channel") || interaction.channel;

    const validch = await guild.channels.cache.get(channel.id);

    if (!validch) throw "That channel is not in this server.";
    if (validch.type !== ChannelType.GuildText)
      throw "That channel is not a text channel.";

    const msDuration = ms(d);
    if (isNaN(msDuration))
      throw "That duration is not valid. Try something different.";

    if (msDuration > 21600000)
      throw "You cannot have a slowmode for more than 6 hours.";

    validch.setRateLimitPerUser(msDuration, `wave slowmode`);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setDescription(`✔️ | Set slowmode of <#${validch.id}> to ${d}.`)
          .setColor("Aqua"),
      ],
    });
  },
});
