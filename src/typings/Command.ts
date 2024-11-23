import {
  ChatInputApplicationCommandData,
  CommandInteraction,
  CommandInteractionOptionResolver,
  Guild,
  GuildMember,
  PermissionResolvable,
} from "discord.js";

export interface ExtendedInteraction extends CommandInteraction {
  member: GuildMember;
}

export interface ExtendedGuild extends Guild {
  guild: Guild;
}

interface RunOptions {
  interaction: ExtendedInteraction;
  opts: CommandInteractionOptionResolver;
  guild: ExtendedGuild;
}

type RunFunction = (options: RunOptions) => any;

export type CommandType = {
  userPermissions?: PermissionResolvable[];
  clientPermissions?: PermissionResolvable[];
  run: RunFunction;
} & ChatInputApplicationCommandData;
