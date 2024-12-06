import { Event } from "../../structures/Event";
import cases from "../../models/moderation/cases";
import logging from "../../models/utility/logging";
import { EmbedBuilder } from "discord.js";

export default new Event("ready", async (c) => {
  setInterval(() => {
    c.guilds.fetch();
    const date = new Date();
    const ms = date.getTime();

    c.guilds.cache.forEach(async (g) => {
      const allTempBans = await cases.find({
        Guild: g.id,
        Type: "Tempban",
      });
      if (!allTempBans || allTempBans.length <= 0) return;
      else {
        allTempBans.forEach(async (tb) => {
          const LS = await logging.findOne({ Guild: g.id });
          const LC = await g.channels.cache.get(LS.LogChannel);

          const expiry = ms + tb.Time;

          if (expiry >= ms) {
            const user = c.users.cache.get(tb.User);

            g.bans.remove(user, `Tempban expired; wave.`);

            if (LC && LC.isSendable()) {
              LC.send({
                embeds: [
                  new EmbedBuilder()
                    .setTitle(`Member Tempban Expired`)
                    .setDescription(
                      `A member in the server has had their temporary ban expired.\nThis means they are available to join the server again.`
                    )
                    .setColor("Aqua")
                    .setThumbnail(g.iconURL()),
                ],
              });
            } else return;

            return;
          } else return;
        });
      }
    });
  }, 30000);
});
