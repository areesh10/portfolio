// ===============================
// 📅 FOOTER YEAR
// ===============================
const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// ===============================
// 🧭 SIDEBAR TOGGLE
// ===============================
const sidebar = document.getElementById("sidebar");
const hamburger = document.getElementById("hamburger");
const closeSidebar = document.getElementById("closeSidebar");

hamburger?.addEventListener("click", () => {
  sidebar?.classList.toggle("show");
});

closeSidebar?.addEventListener("click", () => {
  sidebar?.classList.remove("show");
});

// ===============================
// 🌗 THEME TOGGLE
// ===============================
const themeToggle = document.getElementById("themeToggle");
const body = document.body;

if (themeToggle) {
  themeToggle.textContent = body.classList.contains("dark") ? "☀️" : "🌙";

  themeToggle.addEventListener("click", (e) => {
    e.preventDefault();
    const isDark = body.classList.toggle("dark");
    body.classList.toggle("light", !isDark);
    themeToggle.textContent = isDark ? "☀️" : "🌙";
  });
}

// ===============================
// 💬 AI CHAT
// ===============================
const chatBox = document.getElementById("chatBox");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

function renderChat(sender, text) {
  if (!chatBox) return;
  chatBox.innerHTML = `
    <div class="chat-message ${sender}">
      <strong>${sender === "user" ? "You" : "AI"}:</strong> ${text}
    </div>
  `;
}

// ENTER submits AI chat
chatInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm?.requestSubmit();
  }
});

chatForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = chatInput.value.trim();
  if (!message) return;

  renderChat("user", message);
  chatInput.value = "";

  renderChat("ai", "Thinking...");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    renderChat("ai", data.reply || "No response received.");
  } catch (err) {
    console.error(err);
    renderChat("ai", "Server error. Please try again later.");
  }
});

// ===============================
// 🚀 HIRE ME MODAL
// ===============================
const hireBtn = document.querySelector(".hire-btn");
const modal = document.getElementById("hireModal");
const closeModal = document.querySelector(".close");

hireBtn?.addEventListener("click", () => {
  modal.style.display = "flex";
});

closeModal?.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// ===============================
// 📬 HIRE ME FORM (ENTER FIXED)
// ===============================
const hireForm = document.getElementById("hireForm");

if (hireForm) {
  const messageBox = hireForm.querySelector("textarea");

  // ENTER submits form, Shift+Enter = new line
  messageBox?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      hireForm.requestSubmit();
    }
  });

  hireForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      name: hireForm.elements.name.value.trim(),
      phone: hireForm.elements.phone.value.trim(),
      message: hireForm.elements.message.value.trim()
    };

    if (!payload.name || !payload.phone || !payload.message) {
      alert("❌ All fields are required");
      return;
    }

    try {
      const res = await fetch("/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Message sent successfully!");
        hireForm.reset();
        modal.style.display = "none";
      } else {
        alert("❌ " + (data.message || "Failed to send"));
      }
    } catch (err) {
      console.error(err);
      alert("❌ Server error. Could not send message.");
    }
  });
}

// ===============================
// ✨ GSAP ANIMATIONS
// ===============================
window.addEventListener("load", () => {
  if (!window.gsap) return;

  gsap.from(".hero-content h1", { y: 30, opacity: 0, duration: 1 });
  gsap.from(".hero-content p", {
    y: 20,
    opacity: 0,
    duration: 1,
    delay: 0.2,
    stagger: 0.15
  });
});
