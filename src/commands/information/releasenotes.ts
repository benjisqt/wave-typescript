import { Command } from "../../structures/Command";
import { EmbedBuilder } from "discord.js";
import commit from "git-commit-count";
import git from "simple-git";

export default new Command({
  name: "releasenotes",
  description: "Show what is new in wave!",

  run: async ({ interaction, client }) => {
    commit();
    const count = commit("benjisqt/wave-typescript") / 10;
    const version = `1.${count}`;
    const check = await git().log({ maxCount: 1 });

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(`wave's newest updates.`)
          .setDescription(
            `**Newest Version: v${version}**\n\n*Release Notes:*\n> ${check.latest.message}\n**${check.latest.body}**`
          )
          .setColor("Aqua")
          .setThumbnail(client.user.displayAvatarURL()),
      ],
    });
  },
});
