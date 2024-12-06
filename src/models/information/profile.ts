import { model, Schema } from "mongoose";

export default model(
  "profile",
  new Schema({
    User: String,
    UserNotes: [
      {
        Name: String,
        Note: String,
      },
    ],
    Bio: String,
    BadgesEnabled: Boolean,
  })
);
