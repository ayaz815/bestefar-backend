const mongoose = require("mongoose");

const formSchema = new mongoose.Schema({
  page: { type: Number, required: true },
  question: { type: String, required: true },
  answer: { type: String, required: true },
  firmNaming: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Form = mongoose.model("Form", formSchema);

module.exports = Form;
