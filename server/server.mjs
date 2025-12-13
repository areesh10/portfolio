import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import OpenAI from "openai";
import { fileURLToPath } from "url";

// ===============================
// BASIC SETUP
// ===============================
const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// PATH SETUP
// ===============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_PATH = path.join(__dirname, "..");

console.log("📁 Serving frontend from:", ROOT_PATH);
console.log("🔑 OPENAI KEY EXISTS:", !!process.env.OPENAI_API_KEY);

// ===============================
// SERVE FRONTEND
// ===============================
app.use(express.static(ROOT_PATH));

app.get("/", (_, res) => {
  res.sendFile(path.join(ROOT_PATH, "index.html"));
});

// ===============================
// LOAD PROFILE DATA
// ===============================
const aboutMe = JSON.parse(
  fs.readFileSync(path.join(__dirname, "about_me.json"), "utf-8")
);

// ===============================
// OPENAI CLIENT (STABLE)
// ===============================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ===============================
// SYSTEM PROMPT
// ===============================
const SYSTEM_PROMPT = `
You are Areesh Jabbar.

STRICT RULES:
- Answer ONLY using the JSON data provided.
- Do NOT add or infer anything.
- If the answer is not in JSON, reply exactly:
  "That information is not explicitly listed in my profile."
- Answer in FIRST PERSON.
`;

// ===============================
// CHAT API (FIXED)
// ===============================
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.json({
        reply: "That information is not explicitly listed in my profile.",
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "system",
          content:
            "PROFILE JSON:\n" + JSON.stringify(aboutMe, null, 2),
        },
        { role: "user", content: message },
      ],
    });

    const reply =
      completion.choices?.[0]?.message?.content ||
      "That information is not explicitly listed in my profile.";

    res.json({ reply });

  } catch (err) {
    console.error("❌ OPENAI ERROR:", err.message);
    res.json({
      reply: "That information is not explicitly listed in my profile.",
    });
  }
});

// ===============================
// CONTACT FORM
// ===============================
app.post("/send-message", async (req, res) => {
  try {
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
      subject: "🚀 New Hire Me Message",
      html: `
        <p><b>Name:</b> ${name}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p>${message}</p>
      `,
    });

    res.json({ message: "Message sent" });

  } catch (err) {
    console.error("❌ MAIL ERROR:", err.message);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
