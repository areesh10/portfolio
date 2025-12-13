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
// OPENAI CLIENT (STABLE)
// =====================================================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =====================================================
// SYSTEM PROMPT
// =====================================================
const SYSTEM_PROMPT = `
You are Areesh Jabbar.

STRICT RULES:
- Answer ONLY using information explicitly present in the JSON.
- If info is missing, say:
  "That information is not explicitly listed in my profile."
- Answer in FIRST PERSON.
- Be factual and concise.
`;

// =====================================================
// AI CHAT ENDPOINT (FINAL FIX)
// =====================================================
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ reply: "No message provided." });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          content:
            "PROFILE JSON (ONLY SOURCE OF TRUTH):\n" +
            JSON.stringify(aboutMe, null, 2),
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    console.error("❌ OPENAI ERROR:", error);
    res.status(500).json({
      reply: "Server error. Please try again later.",
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
