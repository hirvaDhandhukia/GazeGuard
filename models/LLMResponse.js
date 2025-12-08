const mongoose = require("mongoose");

const llmResponseSchema = new mongoose.Schema(
  {
    responseId: { type: String, unique: true, required: true },
    request: String,
    response: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("LLMResponse", llmResponseSchema);