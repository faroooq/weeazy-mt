const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const todoSchema = mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: false },
  description: { type: String, required: true },
  photoUrl: { type: String },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }],
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: false },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
  status: { type: String, default: "OPEN" },
  priority: { type: String, default: "LOW" },
  priority_id: { type: String, default: "LOW" },
  type: { type: String, default: "TODO" },
  position: { type: String, required: false },
  column: { type: String, required: false },
  enableEdit: { type: String, required: false },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment", required: false }],
  history: [{ type: mongoose.Schema.Types.ObjectId, ref: "TodoHistory", required: false }],
});

todoSchema.plugin(AutoIncrement, { inc_field: "noteId" });

module.exports = mongoose.model("Todo", todoSchema);
