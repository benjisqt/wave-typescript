import { Command } from "../../structures/Command";
import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
} from "discord.js";

export default new Command({
  name: "nuke",
  description: "Clear all messages from a channel.",
  options: [
    {
      name: "channel",
      description: "The channel you want to nuke.",
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildText],
    },
  ],
  clientPermissions: ["ManageChannels"],
  userPermissions: ["ManageChannels"],

  run: async ({ interaction, guild, opts }) => {
    const channel = opts.getChannel("channel") || interaction.channel;

    const validch = await guild.channels.cache.get(channel.id);
    if (!validch) throw "That channel is not in this server.";

    if (validch.type !== ChannelType.GuildText)
      throw "That channel is not a GuildText channel.";

    try {
      const newChannel = await validch.clone();
      await validch.delete();

      const btn = new ButtonBuilder()
        .setCustomId("close")
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder<ButtonBuilder>().setComponents(btn);

      return newChannel.send({
        embeds: [
          new EmbedBuilder()
            .setDescription(`This channel has had all of its messages cleared.`)
            .setColor("Aqua")
            .setImage(
              "https://media.tenor.com/nANqORN7qhQAAAAM/explosion-explode.gif"
            ),
        ],
        components: [row],
      });
    } catch (err) {
      throw `There was a problem nuking the channel: ${err}`;
    }
  },
});
