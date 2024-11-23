import { CommandInteractionOptionResolver, EmbedBuilder } from "discord.js";
import { client } from "../..";
import { Event } from "../../structures/Event";
import { ExtendedGuild, ExtendedInteraction } from "../../typings/Command";

export default new Event("interactionCreate", async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command)
      return interaction.reply({
        content: `⛔️ | That command is not available.`,
      });

    try {
      await command.run({
        opts: interaction.options as CommandInteractionOptionResolver,
        client,
        guild: interaction.guild as ExtendedGuild,
        interaction: interaction as ExtendedInteraction,
      });
    } catch (err) {
      console.log(err);
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle(`❌ Error`)
            .setDescription(`${err}`)
            .setColor("Red"),
        ],
      });
    }
  }
});
