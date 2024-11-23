import { ExtendedClient } from "./structures/Client";
require("dotenv").config();

export const client = new ExtendedClient({ mongoUri: process.env.MongoDB });

client.start(process.env.botToken);
