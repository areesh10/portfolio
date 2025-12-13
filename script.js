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

if (hamburger && sidebar && closeSidebar) {
  hamburger.addEventListener("click", () => {
    sidebar.classList.toggle("show");
  });

  closeSidebar.addEventListener("click", () => {
    sidebar.classList.remove("show");
  });
}

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
// 💬 AI CHAT — ONE RESPONSE MODEL
// ===============================
const chatBox = document.getElementById("chatBox");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");

// Replace conversation with a single message
function renderSingleMessage(sender, text) {
  chatBox.innerHTML = ""; // clear old messages

  const msg = document.createElement("div");
  msg.className = `chat-message ${sender}`;
  msg.innerHTML = `<strong>${sender === "user" ? "You" : "AI"}:</strong> ${text}`;

  chatBox.appendChild(msg);
}

// ENTER to submit chat
if (chatInput) {
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      chatForm.requestSubmit();
    }
  });
}

if (chatForm && chatInput && chatBox) {
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const message = chatInput.value.trim();
    if (!message) return;

    // Show user's question
    renderSingleMessage("user", message);
    chatInput.value = "";

    // Typing indicator
    chatBox.innerHTML = `
      <div class="chat-message ai">
        <strong>AI:</strong> Thinking...
      </div>
    `;

    try {
      const res = await fetch("http://localhost:8787/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await res.json();

      if (data.reply) {
        renderSingleMessage("ai", data.reply);
      } else {
        renderSingleMessage("ai", "I couldn't generate a response. Please try again.");
      }

    } catch (error) {
      console.error(error);
      renderSingleMessage("ai", "Server error. Please try again later.");
    }
  });
}

// ===============================
// 🧹 CLEAR CHAT BUTTON
// ===============================
const clearChatBtn = document.getElementById("clearChat");
if (clearChatBtn) {
  clearChatBtn.addEventListener("click", () => {
    chatBox.innerHTML = "";
    chatInput.focus();
  });
}

// ===============================
// ✨ GSAP ENTRANCE ANIMATIONS
// ===============================
window.addEventListener("load", () => {
  if (window.gsap) {
    gsap.from(".hero-content h1", { y: 30, opacity: 0, duration: 1 });
    gsap.from(".hero-content p", {
      y: 20,
      opacity: 0,
      duration: 1,
      delay: 0.2,
      stagger: 0.15
    });
  }
});

// ===============================
// 🚀 HIRE ME MODAL LOGIC
// ===============================
const hireBtn = document.querySelector(".hire-btn");
const modal = document.getElementById("hireModal");
const closeBtn = document.querySelector(".close");

hireBtn?.addEventListener("click", () => {
  modal.style.display = "flex";
});

closeBtn?.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modal) modal.style.display = "none";
});

// ===============================
// 📬 HIRE ME FORM + ENTER TO SUBMIT
// ===============================
const hireForm = document.getElementById("hireForm");

if (hireForm) {
  const messageBox = hireForm.elements.message;

  // ENTER submit for hire form
  if (messageBox) {
    messageBox.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        hireForm.requestSubmit();
      }
    });
  }

  hireForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const payload = {
      name: hireForm.elements.name.value,
      phone: hireForm.elements.phone.value,
      message: hireForm.elements.message.value
    };

    try {
      const res = await fetch("http://localhost:8787/send-message", {
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
        alert("❌ " + data.message);
      }

    } catch (error) {
      console.error(error);
      alert("❌ Server error. Could not send message.");
    }
  });
}
