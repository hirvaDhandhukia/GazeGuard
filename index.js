require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const User = require("./models/User");
const LLMResponse = require("./models/LLMResponse")

const app = express();

if (!process.env.MONGODB_URI) {
  console.error("!! MONGODB_URI missing in .env");
  process.exit(1);
}

// middleware
app.use(cors());
app.use(express.json());

// connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("[API] Connected to MongoDB"))
  .catch((err) => {
    console.error("[API] MongoDB connection error:", err);
    process.exit(1);
  });

// API route — upsert user from Clerk
app.post("/api/users", async (req, res) => {
  try {
    console.log(`[user API] req is `, req.body);
    const { id:clerkId, email, firstName, lastName } = req.body;

    if (!clerkId) return res.status(400).json({ error: "clerkId is required" });

    const update = {
      clerkId,
      email: email || null,
      firstName: firstName || null,
      lastName: lastName || null
    };

    const user = await User.findOneAndUpdate({ clerkId }, update, {
      new: true,
      upsert: true,
    });

    res.json(user);
  } catch (err) {
    console.error(`[user API] error is `, err);
    res.status(500).json({ error: err.message });
  }
});

// API to store LLM response
app.post("/api/llm/responses", async (req, res) => {
  try {
    console.log(`[responses API] req is `, req.body);
    const { id:responseId, response, request } = req.body;

    if (!responseId) return res.status(400).json({ error: "responseId is required" });

    const update = {
      responseId,
      request,
      response: JSON.stringify(response)
    };

    const dbResponse = await LLMResponse.findOneAndUpdate({ responseId }, update, {
      new: true,
      upsert: true,
    });
    console.log(`[responses API] dbResponse is `, dbResponse);
    res.json(dbResponse);
  } catch (err) {
    console.error(`[responses API] error is `, err);
    res.status(500).json({ error: err.message });
  }
});


// server
app.listen(process.env.PORT || 4000, () =>
  console.log(`[API] Listening on http://localhost:${process.env.PORT}`)
);
