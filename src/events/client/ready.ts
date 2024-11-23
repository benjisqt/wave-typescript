import { Event } from "../../structures/Event";
import { ActivityType } from "discord.js";
import log from "../../functions/logger";

export default new Event("ready", async (client) => {
  await client.user.setActivity({
    name: `the best bot ever.`,
    type: ActivityType.Watching,
  });

  return log(`${client.user.tag} logged in!`, false);
});
