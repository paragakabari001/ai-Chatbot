/**
 * Dar Global & Wasalt AI Real Estate Advisor - Frontend Application
 */

document.addEventListener("DOMContentLoaded", () => {
  const heroSection = document.getElementById("hero-section");
  const messagesContainer = document.getElementById("messages-container");
  const userInput = document.getElementById("user-input");
  const sendBtn = document.getElementById("send-btn");
  const clearBtn = document.getElementById("clear-btn");
  const modelSelect = document.getElementById("model-select");
  const kbStatsText = document.getElementById("kb-stats-text");

  // Modal elements
  const settingsModal = document.getElementById("settings-modal");
  const openSettingsBtn = document.getElementById("open-settings-btn");
  const closeSettingsBtn = document.getElementById("close-settings-btn");
  const apiKeyInput = document.getElementById("api-key-input");
  const saveKeyBtn = document.getElementById("save-key-btn");
  const clearKeyBtn = document.getElementById("clear-key-btn");

  let isGenerating = false;

  // Initialize saved settings
  const savedKey = localStorage.getItem("openrouter_api_key") || "";
  apiKeyInput.value = savedKey;

  const savedModel = localStorage.getItem("selected_model");
  if (savedModel && modelSelect.querySelector(`option[value="${savedModel}"]`)) {
    modelSelect.value = savedModel;
  }

  // Fetch knowledge base statistics
  async function loadKnowledgeStats() {
    try {
      const res = await fetch("/api/knowledge");
      if (res.ok) {
        const data = await res.json();
        kbStatsText.textContent = `${data.total_documents} Docs Grounded`;
      }
    } catch (err) {
      console.warn("Could not fetch knowledge stats:", err);
    }
  }
  loadKnowledgeStats();

  // Settings Modal Handlers
  openSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.add("active");
  });

  closeSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.remove("active");
  });

  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove("active");
    }
  });

  saveKeyBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem("openrouter_api_key", key);
    } else {
      localStorage.removeItem("openrouter_api_key");
    }
    settingsModal.classList.remove("active");
  });

  clearKeyBtn.addEventListener("click", () => {
    apiKeyInput.value = "";
    localStorage.removeItem("openrouter_api_key");
    settingsModal.classList.remove("active");
  });

  modelSelect.addEventListener("change", () => {
    localStorage.setItem("selected_model", modelSelect.value);
  });

  // Auto-resize input
  userInput.addEventListener("input", () => {
    userInput.style.height = "auto";
    userInput.style.height = Math.min(userInput.scrollHeight, 160) + "px";
  });

  // Enter to send (Shift+Enter for newline)
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener("click", handleSend);

  // Quick suggestion chips
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt");
      if (prompt) {
        userInput.value = prompt;
        userInput.style.height = "auto";
        handleSend();
      }
    });
  });

  clearBtn.addEventListener("click", () => {
    messagesContainer.innerHTML = "";
    heroSection.style.display = "block";
    userInput.value = "";
    userInput.style.height = "auto";
  });

  // Send Message Handler with SSE Streaming
  async function handleSend() {
    const text = userInput.value.trim();
    if (!text || isGenerating) return;

    // Hide hero section on first message
    heroSection.style.display = "none";

    // Append user message bubble
    appendMessage("user", text);
    userInput.value = "";
    userInput.style.height = "auto";
    userInput.focus();

    // Prepare assistant message bubble
    const assistantEl = appendMessage("assistant", "");
    const bubbleEl = assistantEl.querySelector(".bubble-content");
    const citationsEl = assistantEl.querySelector(".citations-wrapper");
    const indicatorEl = assistantEl.querySelector(".typing-indicator");

    isGenerating = true;
    sendBtn.disabled = true;

    let fullText = "";
    let citations = [];

    const headers = { "Content-Type": "application/json" };
    const userApiKey = localStorage.getItem("openrouter_api_key");
    if (userApiKey) {
      headers["X-OpenRouter-Key"] = userApiKey;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          message: text,
          model: modelSelect.value,
          top_k: 4
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const block of lines) {
          if (!block.trim()) continue;
          const blockLines = block.split("\n");
          let eventType = "message";
          let dataStr = "";

          for (const line of blockLines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ")) {
              dataStr = line.slice(6).trim();
            }
          }

          if (eventType === "citations") {
            try {
              citations = JSON.parse(dataStr);
              renderCitations(citationsEl, citations);
            } catch (err) {
              console.warn("Error parsing citations:", err);
            }
          } else if (eventType === "token") {
            if (indicatorEl) indicatorEl.remove();
            try {
              const chunk = JSON.parse(dataStr);
              fullText += chunk.token;
              bubbleEl.innerHTML = marked.parse(fullText);
              scrollToBottom();
            } catch (err) {
              fullText += dataStr;
              bubbleEl.innerHTML = marked.parse(fullText);
              scrollToBottom();
            }
          } else if (eventType === "done") {
            break;
          }
        }
      }

      if (!fullText && indicatorEl) {
        indicatorEl.remove();
        bubbleEl.innerHTML = marked.parse("No response generated.");
      }

      // Add copy action button
      addCopyAction(assistantEl, fullText);

    } catch (err) {
      console.error("Chat error:", err);
      if (indicatorEl) indicatorEl.remove();
      bubbleEl.innerHTML = `<span style="color:#ef4444;">Error connecting to service. Please verify your connection or try again. (${err.message})</span>`;
    } finally {
      isGenerating = false;
      sendBtn.disabled = false;
      scrollToBottom();
    }
  }

  function appendMessage(role, content) {
    const row = document.createElement("div");
    row.className = `message-row ${role}`;

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (role === "user") {
      bubble.textContent = content;
    } else {
      bubble.innerHTML = `
        <div class="bubble-content"></div>
        <div class="typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
        <div class="citations-wrapper" style="display:none;"></div>
      `;
    }

    row.appendChild(bubble);
    messagesContainer.appendChild(row);
    scrollToBottom();
    return row;
  }

  function renderCitations(container, citationsList) {
    if (!citationsList || citationsList.length === 0) return;
    container.style.display = "block";
    container.innerHTML = `
      <div class="citations-header">Verified Sources & Evidence:</div>
      <div class="citation-cards">
        ${citationsList.map(c => {
          const isDarGlobal = c.source === "Dar Global";
          const tagClass = isDarGlobal ? "dar-global" : "wasalt";
          return `
            <a href="${c.url}" target="_blank" rel="noopener noreferrer" class="citation-card" title="${c.category}">
              <span class="citation-source-tag ${tagClass}">${c.source}</span>
              <span>${c.title}</span>
            </a>
          `;
        }).join("")}
      </div>
    `;
    scrollToBottom();
  }

  function addCopyAction(rowEl, text) {
    const bubble = rowEl.querySelector(".message-bubble");
    if (!bubble) return;

    const actionDiv = document.createElement("div");
    actionDiv.className = "message-actions";

    const copyBtn = document.createElement("button");
    copyBtn.className = "action-btn";
    copyBtn.textContent = "📋 Copy Response";
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = "✓ Copied!";
        setTimeout(() => { copyBtn.textContent = "📋 Copy Response"; }, 2000);
      });
    });

    actionDiv.appendChild(copyBtn);
    bubble.appendChild(actionDiv);
  }

  function scrollToBottom() {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });
  }
});
