import { model, Schema } from "mongoose";

export default model(
  "leveling",
  new Schema({
    Guild: String,
    User: String,
    Level: Number,
    XP: Number,
  })
);
