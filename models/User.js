const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    clerkId: { type: String, unique: true, required: true },
    email: String,
    firstName: String,
    lastName: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
