import nodemailer from "nodemailer";
import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// =====================================================
// APP SETUP
// =====================================================
const app = express();
app.use(cors());
app.use(express.json());

// =====================================================
// PATH HELPERS (ESM SAFE)
// =====================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ROOT = portfolio/
const ROOT_PATH = path.join(__dirname, "..");
console.log("📁 Serving frontend from:", ROOT_PATH);

// =====================================================
// SERVE FRONTEND FILES
// =====================================================
app.use(express.static(ROOT_PATH));

app.get("/", (req, res) => {
  res.sendFile(path.join(ROOT_PATH, "index.html"));
});

// =====================================================
// LOAD ABOUT ME JSON (SINGLE SOURCE OF TRUTH)
// =====================================================
const aboutMe = JSON.parse(
  fs.readFileSync(path.join(__dirname, "about_me.json"), "utf-8")
);

// =====================================================
// OPENAI CLIENT
// =====================================================
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =====================================================
// SYSTEM PROMPT (STRICT MODE)
// =====================================================
const SYSTEM_PROMPT = `
You are Areesh Jabbar.

STRICT RULES (MUST FOLLOW):
- Answer ONLY using information explicitly present in the provided JSON.
- Do NOT add, assume, infer, or generalize any skills, tools, or experience.
- Do NOT paraphrase with new terms not found in the JSON.
- If a question cannot be answered using the JSON, reply exactly with:
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
      return res.status(400).json({ error: "No message provided" });
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.0,
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

    res.json({
      reply: completion.choices[0].message.content,
    });

  } catch (error) {
    console.error("❌ OpenAI Chat Error:", error?.message || error);
    res.status(500).json({
      error: "AI server error",
    });
  }
});

// =====================================================
// CONTACT FORM EMAIL ENDPOINT
// =====================================================
app.post("/send-message", async (req, res) => {
  console.log("📩 Incoming Hire Me request:", req.body);

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
    console.error("❌ Email Error:", error?.message || error);
    res.status(500).json({ message: "❌ Failed to send message" });
  }
});

// =====================================================
// START SERVER (RENDER SAFE)
// =====================================================
const PORT = process.env.PORT || 8787;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
