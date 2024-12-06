import { Event } from "../../structures/Event";
import profile from "../../models/information/profile";

export default new Event("interactionCreate", async (i) => {
  if (!i.isStringSelectMenu()) return;

  if (i.customId !== "editprofile") return;

  const selection = i.values[0];

  const userProfile = await profile.findOne({ User: i.user.id });

  if (selection === "editbio") {
    await i.reply({
      content:
        `Send a message below with what you want in your bio (MAX 350).\n*Below are some formatting codes you can use, happy typing!*\n\\n = New line, \`**Text**\` = Bold, \`*Text*\` = Italicised, \`>\` = Blockquote, \`#\` = Heading 1, \`##\` = Heading 2, ` +
        "`Text` = Code",
      ephemeral: true,
    });

    const collector = await i.channel.createMessageCollector({
      filter: (m) => m.author.id === i.user.id,
    });

    collector.on("collect", async (m) => {
      if (m.content.length > 350)
        return m.reply({ content: `That is more than 350 characters.` });

      if (!userProfile) {
        await profile.create({
          User: i.user.id,
          BadgesEnabled: false,
          Bio: m.content,
          UserNotes: [],
        });
      } else {
        userProfile.Bio = m.content;
        await userProfile.save();
      }

      collector.stop();
    });

    await i.editReply({
      content: `Bio saved! People can now view it via /profile view!`,
    });
    return;
  } else if (selection === "showbadges") {
    if (!userProfile) {
      await profile.create({
        User: i.user.id,
        BadgesEnabled: true,
        Bio: "",
        UserNotes: [],
      });
    } else {
      if (userProfile.BadgesEnabled === false) {
        userProfile.BadgesEnabled = true;
        await userProfile.save();
      } else {
        userProfile.BadgesEnabled = false;
        await userProfile.save();
      }
    }

    return i.reply({
      content: `Success! Badges have been ${
        userProfile.BadgesEnabled ? "enabled" : "disabled"
      } on your profile.`,
      ephemeral: true,
    });
  }
});
