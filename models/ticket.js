const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const ticketSchema = mongoose.Schema({
  title: { type: String, required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: false },
  description: { type: String, required: true },
  photo: { type: String },
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: "Uploads" }],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: false },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdOn: { type: Date, default: Date.now },
  updatedOn: { type: Date, default: Date.now },
  status: { type: String, default: "OPEN" },
  priority: { type: String, default: "LOW" },
  type: { type: String, default: "QUESTION" },
  tags: [{ type: String }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment", required: false }],
  history: [{ type: mongoose.Schema.Types.ObjectId, ref: "TicketHistory", required: false }],
});

ticketSchema.plugin(AutoIncrement, { inc_field: "number" });

module.exports = mongoose.model("Ticket", ticketSchema);
