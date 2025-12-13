import express from "express";
import cors from "cors";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import "dotenv/config";

// ===============================
// APP SETUP
// ===============================
const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// PATH HELPERS
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_PATH = path.join(__dirname, "..");

app.use(express.static(ROOT_PATH));
app.get("/", (_, res) =>
  res.sendFile(path.join(ROOT_PATH, "index.html"))
);

// ===============================
// LOAD ABOUT ME JSON
// ===============================
const aboutMe = JSON.parse(
  fs.readFileSync(path.join(__dirname, "about_me.json"), "utf-8")
);

// ===============================
// OPENAI CLIENT (NEW API – REQUIRED)
// ===============================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===============================
// SYSTEM PROMPT
// ===============================
const SYSTEM_PROMPT = `
You are Areesh Jabbar.

RULES:
- Answer ONLY from the provided JSON
- Answer in FIRST PERSON
- If info not found, say:
  "That information is not explicitly listed in my profile."
`;

// ===============================
// AI CHAT ENDPOINT (FIXED)
// ===============================
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.json({
        reply: "That information is not explicitly listed in my profile.",
      });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "system",
          content: `PROFILE JSON:\n${JSON.stringify(aboutMe, null, 2)}`,
        },
        {
          role: "user",
          content: message,
        },
      ],
    });

    res.json({
      reply: response.output_text || 
        "That information is not explicitly listed in my profile.",
    });

  } catch (err) {
    console.error("❌ OPENAI ERROR:", err);
    res.json({
      reply: "That information is not explicitly listed in my profile.",
    });
  }
});

// ===============================
// CONTACT FORM
// ===============================
app.post("/send-message", async (req, res) => {
  const { name, phone, message } = req.body;
  if (!name || !phone || !message) {
    return res.status(400).json({ message: "All fields required" });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Portfolio Contact" <${process.env.EMAIL}>`,
    to: process.env.EMAIL,
    subject: "New Hire Me Message",
    html: `
      <p><b>Name:</b> ${name}</p>
      <p><b>Phone:</b> ${phone}</p>
      <p>${message}</p>
    `,
  });

  res.json({ message: "Message sent" });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on ${PORT}`);
});
