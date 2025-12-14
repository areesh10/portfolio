import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";

// =====================================================
// BASIC CHECKS
// =====================================================
console.log("🔑 OPENAI KEY EXISTS:", !!process.env.OPENAI_API_KEY);
console.log("📧 RESEND KEY EXISTS:", !!process.env.RESEND_API_KEY);

// =====================================================
// APP SETUP
// =====================================================
const app = express();
app.use(cors());
app.use(express.json());

// =====================================================
// PATH HELPERS (ESM)
// =====================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ROOT = portfolio/
const ROOT_PATH = path.join(__dirname, "..");
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
// SYSTEM PROMPT
// =====================================================
const SYSTEM_PROMPT = `
You are Areesh Jabbar.

STRICT RULES:
- Answer ONLY using information present in the JSON.
- If not found, reply exactly:
  "That information is not explicitly listed in my profile."
- Answer in FIRST PERSON.
- Be concise and factual.
`;

// =====================================================
// AI CHAT ENDPOINT
// =====================================================
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.json({ reply: "No message provided." });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          content: `Profile JSON:\n${JSON.stringify(aboutMe, null, 2)}`,
        },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "That information is not explicitly listed in my profile.";

    res.json({ reply });
  } catch (err) {
    console.error("❌ AI ERROR:", err);
    res.status(500).json({
      reply: "Server error. Please try again later.",
    });
  }
});

// =====================================================
// RESEND EMAIL (NO SMTP ❌)
// =====================================================
const resend = new Resend(process.env.RESEND_API_KEY);

app.post("/send-message", async (req, res) => {
  const { name, phone, message } = req.body;

  if (!name || !phone || !message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: process.env.FROM_EMAIL,
      subject: "🚀 New Hire Me Message",
      html: `
        <h2>New Hire Me Request</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Message:</b><br/>${message}</p>
      `,
    });

    res.json({ message: "✅ Message sent successfully!" });
  } catch (err) {
    console.error("❌ RESEND ERROR:", err);
    res.status(500).json({ message: "❌ Failed to send message" });
  }
});

// =====================================================
// START SERVER (RENDER SAFE)
// =====================================================
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
