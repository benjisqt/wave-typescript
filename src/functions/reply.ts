import { EmbedBuilder } from "discord.js";

export default function reply(
  interaction,
  message: string,
  error: boolean,
  errorType: string
) {
  if (error || error === true) {
    return interaction.reply({
      content: `## ⛔️ | waveTS - ${errorType} Error\n> ${message}`,
    });
  } else {
    return interaction.reply({
      embeds: [
        new EmbedBuilder().setDescription(`☑️ | ${message}`).setColor("Green"),
      ],
    });
  }
}
