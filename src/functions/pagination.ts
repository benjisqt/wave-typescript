import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  InteractionResponse,
  Message,
  EmbedBuilder,
  ButtonInteraction,
} from "discord.js";
import { ExtendedInteraction } from "../typings/Command";

async function buttonPages(
  interaction: ExtendedInteraction,
  pages: EmbedBuilder[],
  time: number = 60000
): Promise<Message | InteractionResponse> {
  if (!interaction)
    throw new Error("Please provide a valid interaction argument.");
  if (!pages) throw new Error("Please provide a page argument.");
  if (!Array.isArray(pages)) throw new Error("Pages must be an array.");

  if (typeof time !== "number") throw new Error("Time must be a number.");
  if (time < 30000) throw new Error("Time must be greater than 30 seconds.");

  await interaction.deferReply();

  if (pages.length === 1) {
    const page = (await interaction.editReply({
      embeds: pages,
      components: [],
    })) as Message;

    return page;
  }

  const prev = new ButtonBuilder()
    .setCustomId("prev")
    .setEmoji("⏪")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(true);

  const home = new ButtonBuilder()
    .setCustomId("home")
    .setEmoji("🏠")
    .setStyle(ButtonStyle.Danger)
    .setDisabled(true);

  const next = new ButtonBuilder()
    .setCustomId("next")
    .setEmoji("⏩")
    .setStyle(ButtonStyle.Primary);

  const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    prev,
    home,
    next
  );
  let index = 0;

  const currentPage = (await interaction.editReply({
    embeds: [pages[index]],
    components: [buttonRow],
  })) as Message;

  const collector = currentPage.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time,
  });

  collector.on("collect", async (i: ButtonInteraction) => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({
        content: `You cannot use these buttons!`,
        ephemeral: true,
      });
    }

    await i.deferUpdate();

    if (i.customId === "prev") {
      if (index > 0) index--;
    } else if (i.customId === "home") {
      index = 0;
    } else if (i.customId === "next") {
      if (index < pages.length - 1) index++;
    }

    prev.setDisabled(index === 0);
    home.setDisabled(index === 0);
    next.setDisabled(index === pages.length - 1);

    await currentPage.edit({
      embeds: [pages[index]],
      components: [buttonRow],
    });

    collector.resetTimer();
  });

  collector.on("end", async () => {
    await currentPage.edit({
      embeds: [pages[index]],
      components: [],
    });
  });

  return currentPage;
}

export default buttonPages;
