import { Command } from "../../structures/Command";
import { ApplicationCommandOptionType } from "discord.js";

export default new Command({
  name: "purge",
  description: "Purge recent messages from a channel.",
  options: [
    {
      name: "messages",
      description: "The number of messages you want to delete. (Max: 99)",
      type: ApplicationCommandOptionType.Integer,
      required: true,
      maxValue: 99,
      minValue: 1,
    },
    {
      name: "user",
      description: "The user whose messages you want to delete.",
      type: ApplicationCommandOptionType.User,
    },
  ],
  clientPermissions: ["ManageMessages"],
  userPermissions: ["ManageMessages"],

  run: async ({ interaction, guild, opts }) => {
    const messages = opts.getInteger("messages");
    const user = opts.getUser("user");

    if (!interaction.channel.isTextBased())
      throw "This channel is not text-based.";

    try {
      const msgs = await interaction.channel.messages.fetch({
        limit: messages,
      });

      const filteredMsgs = user
        ? msgs.filter((msg) => msg.author.id === user.id).first(messages)
        : msgs.first(messages);

      if (!filteredMsgs || filteredMsgs.length <= 0)
        throw `No messages found to delete ${user ? `from ${user.tag}` : ""}`;

      interaction.channel.bulkDelete(filteredMsgs, true).then(async (m) => {
        return interaction.reply({
          content: `Deleted ${m.size} messages!`,
          ephemeral: true,
        });
      });
    } catch (err) {
      throw `An error occurred trying to bulk delete messages: ${err}`;
    }
  },
});
