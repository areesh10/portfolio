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
// LOAD ABOUT ME JSON (CONFIRMED PATH)
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
// AI CHAT ENDPOINT (LOGIC-FIRST, AI-FORMATTER)
// =====================================================
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.json({ reply: "Please ask a question." });
    }

    const q = message.toLowerCase();
    let context = null;

    if (q.includes("skill")) {
      context = aboutMe.skills;
    } else if (q.includes("project")) {
      context = aboutMe.projects;
    } else if (q.includes("experience")) {
      context = aboutMe.experience;
    } else if (q.includes("education")) {
      context = aboutMe.education;
    } else if (q.includes("about") || q.includes("summary")) {
      context = aboutMe.summary;
    } else if (q.includes("strength")) {
      context = aboutMe.strengths;
    } else if (q.includes("interest")) {
      context = aboutMe.career_interests;
    }

    // ❌ NO MATCH → SAFE FALLBACK
    if (!context) {
      return res.json({
        reply: "That information is not explicitly listed in my profile.",
      });
    }

    // ✅ USE AI ONLY TO FORMAT THE ANSWER
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You are Areesh Jabbar. Answer in first person. Be clear, professional, and concise.",
        },
        {
          role: "user",
          content: JSON.stringify(context, null, 2),
        },
      ],
    });

    res.json({
      reply: completion.choices[0].message.content,
    });

  } catch (error) {
    console.error("❌ AI ERROR:", error);
    res.json({
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
// START SERVER (RENDER SAFE)
// =====================================================
const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
