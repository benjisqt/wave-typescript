import { model, Schema } from "mongoose";

export default model(
  "tideguard",
  new Schema({
    Guild: String,
    NoAlt: {
      Enabled: Boolean,
      Punishment: String,
      MaxDays: Number,
    },
    NoGhost: {
      Enabled: Boolean,
    },
    NoSpam: {
      Enabled: Boolean,
      MessageLimit: Number,
    },
  })
);
