import { Event } from "../../structures/Event";

export default new Event("interactionCreate", async (i) => {
  if (!i.isButton()) return;

  if (i.customId !== "close") return;

  i.deferUpdate();

  return i.message.delete();
});
