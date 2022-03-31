const mongoose = require("mongoose");

const teamSchema = mongoose.Schema({
  name: { type: String, required: true },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
});

// teamSchema.index({ name: 1, project: 1 }, { unique: true });

module.exports = mongoose.model("Team", teamSchema);
