import { model, Schema } from "mongoose";

export default model(
  "leveling-server",
  new Schema({
    Guild: String,
    LevelRewardUnlock: Array,
    LevelRewards: Array,
    Difficulty: Number,
    CommandXP: Boolean,
    LevelChannel: String,
  })
);
