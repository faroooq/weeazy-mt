const mongoose = require("mongoose");

const projectSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: false },
  status: { type: String, default: "Active" },
  employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
});

module.exports = mongoose.model("Project", projectSchema);
