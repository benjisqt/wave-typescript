import { Event } from "../../structures/Event";
import autorole from "../../models/utility/autorole";

export default new Event("guildMemberAdd", async (member) => {
  const AR = await autorole.findOne({ Guild: member.guild.id });
  if (!AR) return;

  const role = await member.guild.roles.cache.get(AR.Role);
  if (!role) return;

  if (role.position >= member.guild.members.me.roles.highest.position) return;

  try {
    member.roles.add(role.id);
  } catch (err) {
    return;
  }
});
