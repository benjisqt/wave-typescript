import { model, Schema } from "mongoose";

export default model(
  "cases",
  new Schema({
    Guild: String,
    User: String,
    Reason: String,
    Type: String,
    Moderator: String,
    Time: String,
  })
);
