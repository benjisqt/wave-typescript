import { Event } from "../../structures/Event";
import tideguard from "../../models/tideguard/tideguard";
const map = new Map();

export default new Event("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.guild) return;

  const AS = await tideguard.findOne({ Guild: msg.guild.id });
  if (!AS) return;
  if (AS) {
    if (!AS.NoSpam) return;
    if (!AS.NoSpam.Enabled) return;
  }

  if (map.has(msg.author.id)) {
    const data = map.get(msg.author.id);
    const { lastmsg, timer } = data;
    const diff = msg.createdTimestamp - lastmsg.createdTimestamp;
    let msgs = data.msgs;

    if (diff > 2000) {
      clearTimeout(timer);

      data.msgs = 1;
      data.lastmsg = msg;

      data.timer = setTimeout(() => {
        map.delete(msg.author.id);
      }, 5000);

      map.set(msg.author.id, data);
    } else {
      ++msgs;

      if (parseInt(msgs) === 5) {
        const member = await msg.guild.members.cache.get(msg.author.id);

        member.timeout(1 * 60 * 1000, `Spamming.`).catch((err) => {
          console.log(err);
        });

        msg.reply({
          content: `You have been temporarily been timed out for 60 seconds for spamming.`,
        });
      } else {
        data.msgs = msgs;
        map.set(msg.author.id, data);
      }
    }
  } else {
    let remove = setTimeout(() => {
      map.delete(msg.author.id);
    }, 5000);

    map.set(msg.author.id, {
      msgs: 1,
      lastmsg: msg,
      timer: remove,
    });
  }
});
