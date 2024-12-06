import { model, Schema } from "mongoose";

export default model(
  "channellock",
  new Schema({
    Guild: String,
    Channel: String,
  })
);
