import { model, Schema } from "mongoose";

export default model(
  "temptimeout",
  new Schema({
    Guild: String,
    User: String,
  })
);
