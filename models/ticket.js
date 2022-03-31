const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const ticketSchema = mongoose.Schema({
  title: { type: String },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: false },
  description: { type: String },
  files: [{ type: mongoose.Schema.Types.ObjectId, ref: "Uploads" }],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: false },
  raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdOn: { type: Date, default: Date.now },
  status: { type: String, default: "OPEN" },
  priority: { type: String, default: "" },
  type: { type: String, default: "BUG" },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment", required: false }],
  history: [{ type: mongoose.Schema.Types.ObjectId, ref: "TicketHistory", required: false }],
});

ticketSchema.plugin(AutoIncrement, { inc_field: "number" });

module.exports = mongoose.model("Ticket", ticketSchema);
