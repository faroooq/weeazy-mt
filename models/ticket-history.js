const mongoose = require("mongoose");

const ticketHistorySchema = mongoose.Schema({
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  attribute: { type: String, required: true },
  oldValue: { type: String, required: false },
  newValue: { type: String, required: true },
  dateTime: { type: Date, default: Date.now },
});

module.exports = mongoose.model("TicketHistory", ticketHistorySchema);
