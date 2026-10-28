/**
 * Enterprise AI Real Estate Advisor - Dar Global & Wasalt
 * Features:
 * - Real-time SSE streaming with typing cursor
 * - Entity recognition: Automatically injects rich interactive highlight cards
 * - Tab switcher between Dar Global and Wasalt portals
 * - Recruiter Assignment Checklist modal
 * - Dynamic OpenRouter key configuration
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const heroCanvas = document.getElementById("hero-canvas");
  const messagesStream = document.getElementById("messages-stream");
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-chat-btn");
  const clearBtn = document.getElementById("clear-chat-btn");
  const modelSelect = document.getElementById("model-select");
  const kbStatsBadge = document.getElementById("kb-stats-badge");

  // Tabs
  const tabDarGlobal = document.getElementById("tab-dar-global");
  const tabWasalt = document.getElementById("tab-wasalt");
  const panelDarGlobal = document.getElementById("panel-dar-global");
  const panelWasalt = document.getElementById("panel-wasalt");

  // Modals
  const recruiterModal = document.getElementById("recruiter-modal");
  const openRecruiterBtn = document.getElementById("open-recruiter-modal-btn");
  const closeRecruiterBtn1 = document.getElementById("close-recruiter-modal-btn");
  const closeRecruiterBtn2 = document.getElementById("close-recruiter-modal-btn-2");

  const settingsModal = document.getElementById("settings-modal");
  const openSettingsBtn = document.getElementById("open-settings-btn");
  const closeSettingsBtn = document.getElementById("close-settings-modal-btn");
  const apiKeyInput = document.getElementById("api-key-input");
  const saveKeyBtn = document.getElementById("save-key-btn");
  const clearKeyBtn = document.getElementById("clear-key-btn");

  let isGenerating = false;

  // Restore saved settings
  const savedKey = localStorage.getItem("openrouter_api_key") || "";
  apiKeyInput.value = savedKey;

  const savedModel = localStorage.getItem("selected_model");
  if (savedModel && modelSelect.querySelector(`option[value="${savedModel}"]`)) {
    modelSelect.value = savedModel;
  }

  modelSelect.addEventListener("change", () => {
    localStorage.setItem("selected_model", modelSelect.value);
  });

  // Fetch knowledge base statistics
  async function loadKnowledgeStats() {
    try {
      const res = await fetch("/api/knowledge");
      if (res.ok) {
        const data = await res.json();
        kbStatsBadge.textContent = `${data.total_documents} Grounded Docs`;
      }
    } catch (e) {
      console.warn("Could not load knowledge stats:", e);
    }
  }
  loadKnowledgeStats();

  // Tab Switching
  tabDarGlobal.addEventListener("click", () => {
    tabDarGlobal.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all bg-brand-gold/15 text-brand-gold border border-brand-gold/30";
    tabWasalt.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all text-slate-400 hover:text-slate-200";
    panelDarGlobal.classList.remove("hidden");
    panelWasalt.classList.add("hidden");
  });

  tabWasalt.addEventListener("click", () => {
    tabWasalt.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30";
    tabDarGlobal.className = "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all text-slate-400 hover:text-slate-200";
    panelWasalt.classList.remove("hidden");
    panelDarGlobal.classList.add("hidden");
  });

  // Modal Handlers
  function toggleModal(modal, show) {
    if (show) {
      modal.classList.remove("opacity-0", "pointer-events-none");
    } else {
      modal.classList.add("opacity-0", "pointer-events-none");
    }
  }

  openRecruiterBtn.addEventListener("click", () => toggleModal(recruiterModal, true));
  closeRecruiterBtn1.addEventListener("click", () => toggleModal(recruiterModal, false));
  closeRecruiterBtn2.addEventListener("click", () => toggleModal(recruiterModal, false));
  recruiterModal.addEventListener("click", (e) => {
    if (e.target === recruiterModal) toggleModal(recruiterModal, false);
  });

  openSettingsBtn.addEventListener("click", () => toggleModal(settingsModal, true));
  closeSettingsBtn.addEventListener("click", () => toggleModal(settingsModal, false));
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) toggleModal(settingsModal, false);
  });

  saveKeyBtn.addEventListener("click", () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      localStorage.setItem("openrouter_api_key", key);
    } else {
      localStorage.removeItem("openrouter_api_key");
    }
    toggleModal(settingsModal, false);
  });

  clearKeyBtn.addEventListener("click", () => {
    apiKeyInput.value = "";
    localStorage.removeItem("openrouter_api_key");
    toggleModal(settingsModal, false);
  });

  // Auto-resize chat textarea
  chatInput.addEventListener("input", () => {
    chatInput.style.height = "auto";
    chatInput.style.height = Math.min(chatInput.scrollHeight, 130) + "px";
  });

  // Enter to send
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });

  sendBtn.addEventListener("click", handleSend);

  // Quick Chips & Sidebar Card Click Triggers
  function setupPrompts() {
    document.querySelectorAll(".chip-btn, .card-prompt-trigger").forEach((el) => {
      el.addEventListener("click", () => {
        const prompt = el.getAttribute("data-prompt");
        if (prompt && !isGenerating) {
          chatInput.value = prompt;
          chatInput.style.height = "auto";
          handleSend();
        }
      });
    });
  }
  setupPrompts();

  // Clear Chat
  clearBtn.addEventListener("click", () => {
    messagesStream.innerHTML = "";
    messagesStream.classList.add("hidden");
    heroCanvas.classList.remove("hidden");
    chatInput.value = "";
    chatInput.style.height = "auto";
  });

  // Main Streaming Handler
  async function handleSend() {
    const text = chatInput.value.trim();
    if (!text || isGenerating) return;

    // Show messages stream & hide hero canvas
    heroCanvas.classList.add("hidden");
    messagesStream.classList.remove("hidden");

    // Append User Message
    appendUserMessage(text);
    chatInput.value = "";
    chatInput.style.height = "auto";
    chatInput.focus();

    // Prepare Assistant Bubble
    const { messageEl, textEl, citationsContainer, actionsContainer } = appendAssistantContainer();

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
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      // Add typing cursor
      textEl.classList.add("typing-cursor");

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
              renderCitations(citationsContainer, citations);
            } catch (err) {
              console.warn("Citations parse error:", err);
            }
          } else if (eventType === "token") {
            try {
              const chunk = JSON.parse(dataStr);
              fullText += chunk.token;
            } catch (err) {
              fullText += dataStr;
            }
            textEl.innerHTML = marked.parse(fullText);
            scrollToBottom();
          } else if (eventType === "done") {
            break;
          }
        }
      }

      // Remove typing cursor
      textEl.classList.remove("typing-cursor");

      if (!fullText) {
        textEl.innerHTML = marked.parse("No response generated.");
      }

      // Check and inject interactive Entity Highlight Cards
      injectEntityCards(messageEl, fullText);

      // Render Action Buttons (Copy, share)
      renderActionButtons(actionsContainer, fullText);

    } catch (err) {
      console.error("Chat error:", err);
      textEl.classList.remove("typing-cursor");
      textEl.innerHTML = `<div class="p-3 rounded-lg bg-red-950/40 border border-red-500/40 text-red-300 text-xs">Error connecting to advisor: ${err.message}. Please retry.</div>`;
    } finally {
      isGenerating = false;
      sendBtn.disabled = false;
      scrollToBottom();
    }
  }

  // DOM Helpers
  function appendUserMessage(text) {
    const wrap = document.createElement("div");
    wrap.className = "flex justify-end";
    wrap.innerHTML = `
      <div class="max-w-[85%] sm:max-w-xl bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/60 rounded-2xl rounded-tr-sm px-4 py-3 text-slate-100 text-xs sm:text-sm shadow-md">
        ${escapeHtml(text)}
      </div>
    `;
    messagesStream.appendChild(wrap);
    scrollToBottom();
  }

  function appendAssistantContainer() {
    const wrap = document.createElement("div");
    wrap.className = "flex flex-col gap-2 max-w-full";

    const bubble = document.createElement("div");
    bubble.className = "bg-brand-card/90 border border-brand-border rounded-2xl rounded-tl-sm p-4 sm:p-5 text-slate-200 text-xs sm:text-sm shadow-xl";

    const textEl = document.createElement("div");
    textEl.className = "markdown-body";

    const citationsContainer = document.createElement("div");
    citationsContainer.className = "mt-4 pt-3 border-t border-brand-border hidden";

    const actionsContainer = document.createElement("div");
    actionsContainer.className = "mt-3 flex items-center justify-between text-[11px] text-slate-400";

    bubble.appendChild(textEl);
    bubble.appendChild(citationsContainer);
    bubble.appendChild(actionsContainer);

    wrap.appendChild(bubble);
    messagesStream.appendChild(wrap);
    scrollToBottom();

    return { messageEl: wrap, textEl, citationsContainer, actionsContainer };
  }

  function renderCitations(container, citationsList) {
    if (!citationsList || citationsList.length === 0) return;
    container.classList.remove("hidden");
    container.innerHTML = `
      <div class="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5 text-brand-gold" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"></path>
        </svg>
        <span>Grounded Knowledge Provenance & Citations:</span>
      </div>
      <div class="flex flex-wrap gap-2">
        ${citationsList.map(c => {
          const isDar = c.source === "Dar Global";
          const borderClr = isDar ? "border-brand-gold/40 hover:border-brand-gold text-brand-gold" : "border-brand-emerald/40 hover:border-brand-emerald text-brand-emerald";
          const bgTag = isDar ? "bg-brand-gold/15" : "bg-brand-emerald/15";
          return `
            <a href="${c.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/80 border ${borderClr} text-[11px] transition-all hover:bg-slate-800" title="${c.category}">
              <span class="px-1.5 py-0.2 rounded ${bgTag} font-bold text-[9px] uppercase">${c.source}</span>
              <span class="text-slate-300 truncate max-w-xs">${c.title}</span>
            </a>
          `;
        }).join("")}
      </div>
    `;
    scrollToBottom();
  }

  // Interactive Entity Highlight Cards
  function injectEntityCards(container, text) {
    const lower = text.toLowerCase();
    const highlights = [];

    // Pagani DaVinci
    if (lower.includes("davinci") || lower.includes("pagani")) {
      highlights.push({
        title: "DaVinci Tower by Pagani",
        partner: "Pagani Automobili",
        tag: "Luxury Residential Landmark",
        location: "Dubai Water Canal",
        features: "Carbon-fiber interiors, kinetic elements, Burj Khalifa views",
        link: "https://darglobal.co.uk/projects",
        color: "amber"
      });
    }

    // AIDA Oman
    if (lower.includes("aida") || lower.includes("trump")) {
      highlights.push({
        title: "AIDA Muscat Community",
        partner: "Trump International Golf Club",
        tag: "Integrated Tourism Complex (ITC)",
        location: "Muscat, Oman (130m Cliffside)",
        features: "Freehold ownership for all nationalities, golf villas, permanent residency",
        link: "https://darglobal.co.uk/projects",
        color: "emerald"
      });
    }

    // Missoni Urban Oasis
    if (lower.includes("urban oasis") || lower.includes("missoni")) {
      highlights.push({
        title: "Urban Oasis by Missoni",
        partner: "Missoni Italian Haute Couture",
        tag: "Waterfront Branded Tower",
        location: "Dubai Canal, Business Bay",
        features: "Signature zig-zag geometries, waterfront pool, canal lifestyle",
        link: "https://darglobal.co.uk/projects",
        color: "purple"
      });
    }

    // Lamborghini Tierra Viva
    if (lower.includes("tierra viva") || lower.includes("lamborghini")) {
      highlights.push({
        title: "Tierra Viva by Automobili Lamborghini",
        partner: "Automobili Lamborghini",
        tag: "Ultra-Luxury Private Enclave",
        location: "Benahavís, Marbella, Spain",
        features: "53 hillside villas (Diamante, Zafiro, Esmeralda) overlooking the Mediterranean",
        link: "https://darglobal.co.uk/projects",
        color: "red"
      });
    }

    // Wasalt Riyadh / Saudi PropTech
    if (lower.includes("wasalt") || lower.includes("riyadh") || lower.includes("fal") || lower.includes("rega") || lower.includes("ejar")) {
      highlights.push({
        title: "Wasalt Saudi Real Estate Platform",
        partner: "Quara Holding & Saudi REGA",
        tag: "Fal Licensed & Ejar Certified",
        location: "Kingdom of Saudi Arabia (Riyadh, Jeddah, Dammam)",
        features: "100% verified listings, 360-degree tours, mortgage calculator, legally binding Ejar contracts",
        link: "https://wasalt.sa/en",
        color: "emerald"
      });
    }

    if (highlights.length === 0) return;

    const highlightBox = document.createElement("div");
    highlightBox.className = "mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5";
    highlightBox.innerHTML = highlights.slice(0, 2).map(h => `
      <div class="p-3 rounded-xl bg-slate-900/90 border border-${h.color}-500/30 flex flex-col justify-between hover:border-${h.color}-400 transition-all shadow-sm">
        <div>
          <div class="flex items-center justify-between text-xs font-bold text-white mb-1">
            <span>${h.title}</span>
            <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-${h.color}-500/20 text-${h.color}-300">${h.partner}</span>
          </div>
          <div class="text-[11px] text-slate-400 mb-1.5">📍 ${h.location}</div>
          <div class="text-[11px] text-slate-300 leading-snug">${h.features}</div>
        </div>
        <div class="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
          <span class="text-slate-500">${h.tag}</span>
          <a href="${h.link}" target="_blank" rel="noopener" class="text-brand-gold hover:underline font-semibold flex items-center gap-1">
            Official Portal ↗
          </a>
        </div>
      </div>
    `).join("");

    container.querySelector(".bg-brand-card\\/90").appendChild(highlightBox);
    scrollToBottom();
  }

  function renderActionButtons(container, text) {
    const copyBtn = document.createElement("button");
    copyBtn.className = "px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors flex items-center gap-1 font-medium";
    copyBtn.innerHTML = `
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
      </svg>
      <span>Copy Response</span>
    `;

    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(text).then(() => {
        copyBtn.innerHTML = `✓ Copied!`;
        setTimeout(() => {
          copyBtn.innerHTML = `
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
            <span>Copy Response</span>
          `;
        }, 2000);
      });
    });

    container.innerHTML = `<span>AI Advisory Engine • Grounded Inference</span>`;
    container.appendChild(copyBtn);
  }

  function scrollToBottom() {
    messagesStream.scrollTo({
      top: messagesStream.scrollHeight,
      behavior: "smooth"
    });
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
