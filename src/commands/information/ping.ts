import { Command } from "../../structures/Command";

export default new Command({
  name: "ping",
  description: "Ping the bot to see if it's alive!",

  run: async ({ interaction, client }) => {
    const msg = await interaction.reply({
      content: `Pinging...`,
      ephemeral: true,
    });

    const delay = msg?.createdTimestamp - interaction.createdTimestamp;
    const ping = Math.round(client.ws.ping);

    if (msg) {
      return msg.edit({
        content: `## :ping_pong: Pong!\n**Round trip took ${ping}ms.**\n*Message Ping: ${delay}ms*`,
      });
    }
  },
});
