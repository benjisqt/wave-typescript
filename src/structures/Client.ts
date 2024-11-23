import {
  ApplicationCommandDataResolvable,
  Client,
  ClientEvents,
  Collection,
  IntentsBitField,
  Partials,
} from "discord.js";
import { CommandType, ExtendedInteraction } from "../typings/Command";
import { promisify } from "util";
import { RegisterCommandOptions } from "../typings/Client";
import { Event } from "./Event";
import glob from "glob";
import log from "../functions/logger";
import mongoose from "mongoose";

const globPromise = promisify(glob);

interface ExtendedClientOptions {
  intents?: IntentsBitField;
  partials?: Partials[];
  mongoUri: string;
}

export class ExtendedClient extends Client {
  commands: Collection<string, CommandType> = new Collection();
  mongoUri: string;

  constructor(options: ExtendedClientOptions) {
    super({
      intents: options.intents || [
        IntentsBitField.Flags.AutoModerationConfiguration,
        IntentsBitField.Flags.AutoModerationExecution,
        IntentsBitField.Flags.GuildEmojisAndStickers,
        IntentsBitField.Flags.GuildInvites,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.Guilds,
      ],
      partials: options.partials || [
        Partials.Channel,
        Partials.GuildMember,
        Partials.Reaction,
        Partials.Message,
      ],
    });

    this.mongoUri = options.mongoUri;
  }

  async start(token: string) {
    await this.connectMongo();
    this.registerModules();
    this.login(token);
  }

  async connectMongo() {
    try {
      await mongoose.connect(this.mongoUri);
      log("MongoDB connection successful", false);
    } catch (error) {
      log(`MongoDB connection failed: ${error}`, true);
      process.exit(1); // Exit the process if MongoDB fails to connect
    }
  }

  reply(interaction: ExtendedInteraction, message: string) {
    interaction.reply({
      content: `${message}`,
    });
  }

  editReply(interaction: ExtendedInteraction, message: string) {
    interaction.editReply({
      content: `${message}`,
    });
  }

  async importFile(filePath: string) {
    return (await import(filePath))?.default;
  }

  async registerCommands({ commands }: RegisterCommandOptions) {
    this.application?.commands.set(commands);
    log(`Registering global commands`, false);
  }

  async registerModules() {
    const slashCommands: ApplicationCommandDataResolvable[] = [];
    const commandFiles = await globPromise(
      `${__dirname}/../commands/*/*{.ts,.js}`
    );

    commandFiles.forEach(async (filePath: string) => {
      const command: CommandType = await this.importFile(filePath);
      if (!command.name) return;

      this.commands.set(command.name, command);
      slashCommands.push(command);
    });

    this.on("ready", () => {
      this.registerCommands({
        commands: slashCommands,
      });
    });

    // Events
    const eventFiles = await globPromise(`${__dirname}/../events/*/*{.ts,.js}`);
    eventFiles.forEach(async (filePath: string) => {
      const event: Event<keyof ClientEvents> = await this.importFile(filePath);
      this.on(event.event, event.run);
    });
  }
}
