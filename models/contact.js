const mongoose = require("mongoose");

const contactSchema = mongoose.Schema({
  email: { type: String, required: false },
  firstName: { type: String, required: false },
  lastName: { type: String, required: false },
  type: { type: String, required: false },
  desc: { type: String, required: false },
});

module.exports = mongoose.model("Contact", contactSchema);
