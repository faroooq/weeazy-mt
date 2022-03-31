const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "" },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
