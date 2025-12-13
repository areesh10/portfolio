import nodemailer from "nodemailer";
import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// =====================================================
// DEBUG
// =====================================================
console.log("🔑 OPENAI KEY EXISTS:", !!process.env.OPENAI_API_KEY);

// =====================================================
// APP SETUP
// =====================================================
const app = express();
app.use(cors());
app.use(express.json());

// =====================================================
// PATH HELPERS
// =====================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ROOT = portfolio/
const ROOT_PATH = path.join(__dirname, "..");
console.log("📁 Serving frontend from:", ROOT_PATH);

// =====================================================
// SERVE FRONTEND
// =====================================================
app.use(express.static(ROOT_PATH));

app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT_PATH, "index.html"));
});

// =====================================================
// LOAD ABOUT ME JSON
// =====================================================
const aboutMe = JSON.parse(
  fs.readFileSync(path.join(__dirname, "about_me.json"), "utf-8")
);

// =====================================================
// OPENAI CLIENT
// =====================================================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =====================================================
// SYSTEM PROMPT (FIXED & HUMAN-FRIENDLY)
// =====================================================
const SYSTEM_PROMPT = `
You are Areesh Jabbar.

RULES:
- Answer using ONLY the information present in the provided JSON.
- You MAY summarize, rephrase, or combine information from different JSON fields.
- You MUST NOT add new skills, tools, experience, or facts.
- If a question cannot be answered using the JSON at all, reply exactly with:
  "That information is not explicitly listed in my profile."
- Answer in FIRST PERSON ("I").
- Never say you are an AI, assistant, or model.
- Keep answers factual, concise, and professional.
`;

// =====================================================
// AI CHAT ENDPOINT
// =====================================================
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        reply: "Please ask a valid question.",
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          content: `Here is my verified profile data (JSON). This is the ONLY source of truth:\n${JSON.stringify(
            aboutMe,
            null,
            2
          )}`,
        },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion?.choices?.[0]?.message?.content ||
      "That information is not explicitly listed in my profile.";

    res.json({ reply });

  } catch (error) {
    console.error("❌ AI ERROR:", error?.message || error);
    res.json({
      reply: "That information is not explicitly listed in my profile.",
    });
  }
});

// =====================================================
// CONTACT FORM
// =====================================================
app.post("/send-message", async (req, res) => {
  const { name, phone, message } = req.body;

  if (!name || !phone || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
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
      subject: "🚀 New Hire Me Message",
      html: `
        <h2>New Hire Me Request</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Message:</b><br/>${message}</p>
      `,
    });

    res.json({ message: "✅ Message sent successfully!" });

  } catch (error) {
    console.error("❌ Email Error:", error);
    res.status(500).json({ message: "❌ Failed to send message" });
  }
});

// =====================================================
// START SERVER
// =====================================================
const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
