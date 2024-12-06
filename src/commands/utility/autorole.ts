import { Command } from "../../structures/Command";
import autorole from "../../models/utility/autorole";
import { ApplicationCommandOptionType, EmbedBuilder } from "discord.js";

export default new Command({
  name: "autorole",
  description: "Toggle automatic role giving.",
  options: [
    {
      name: "role",
      description: "The role you want to give to a user when they join.",
      type: ApplicationCommandOptionType.Role,
    },
  ],

  run: async ({ interaction, guild, opts }) => {
    const role = opts.getRole("role");
    const validrole = await guild.roles.cache.get(role.id);

    const AR = await autorole.findOne({ Guild: guild.id });

    const title = `Autorole ${AR ? "Disabled" : "Enabled/Edited"}`;
    const description = `The autorole system has been ${
      AR ? "disabled" : "enabled or edited"
    }.`;

    if (!validrole) {
      if (!AR) {
        throw "A role must be provided to enable the autorole system.";
      } else {
        await AR.deleteOne();
      }
    } else {
      if (validrole.position >= guild.members.me.roles.highest.position)
        throw "That role is higher than my role; I cannot give that role.";

      if (validrole.position >= interaction.member.roles.highest.position)
        throw "That role is higher than your role; I cannot give that role.";

      if (AR) {
        AR.Role = validrole.id;
        await AR.save();
      } else {
        await autorole.create({
          Guild: guild.id,
          Role: validrole.id,
        });
      }
    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor("Aqua")
      .setThumbnail(interaction.guild.iconURL());

    if (validrole)
      embed.setFields({ name: `Role`, value: `<@${validrole.id}>` });

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
});
