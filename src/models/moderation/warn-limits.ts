import { model, Schema } from "mongoose";

export default model(
  "warn-limits",
  new Schema({
    Guild: String,
    WarnLimit: Number,
  })
);
