import { model, Schema } from "mongoose";

export default model(
  "logging",
  new Schema({
    Guild: String,
    LogChannel: String,
    ActionsLogged: Array,
  })
);
