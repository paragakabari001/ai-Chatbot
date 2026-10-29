import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

export function renderMarkdown(raw) {
  if (!raw) return "";
  let html = marked.parse(raw);

  // Replace all links with auto-fetched live website favicons and secure attributes
  html = html.replace(
    /<a\s+([^>]*href=["'](https?:\/\/([^"'/\s]+)[^"']*)["'][^>]*)>/gi,
    (match, attrs, fullUrl, host) => {
      const cleanHost = host.replace(/^www\./, '');
      const faviconUrl = `https://www.google.com/s2/favicons?domain=${cleanHost}&sz=32`;
      const fallbackUrl = `https://icons.duckduckgo.com/ip3/${cleanHost}.ico`;
      const targetRel = attrs.includes("target=") ? "" : ` target="_blank" rel="noopener noreferrer"`;

      return `<a ${attrs}${targetRel} class="inline-link"><img src="${faviconUrl}" alt="" class="ext-favicon inline-block w-3.5 h-3.5 mr-1 align-text-bottom rounded-sm flex-shrink-0" onError="this.onerror=null;this.src='${fallbackUrl}';this.onerror=function(){this.style.display='none';};" />`;
    }
  );

  return html;
}

export function stripMarkdown(text) {
  return text
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/[*_`~]+/g, "")
    .replace(/>\s/g, "")
    .replace(/[-*+]\s/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

const LS_SESSIONS_KEY = "dg_wasalt_history";
const LS_CURRENT_ID_KEY = "dg_wasalt_current_id";

export function loadHistory() {
  try {
    const raw = localStorage.getItem(LS_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(sessions) {
  try {
    localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(sessions));
  } catch {}
}

export function loadCurrentId() {
  try {
    return localStorage.getItem(LS_CURRENT_ID_KEY) || null;
  } catch {
    return null;
  }
}

export function saveCurrentId(id) {
  try {
    if (id) localStorage.setItem(LS_CURRENT_ID_KEY, id);
    else localStorage.removeItem(LS_CURRENT_ID_KEY);
  } catch {}
}

export function newSession() {
  return {
    id: "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
    title: "New Chat",
    messages: [],
    ts: Date.now()
  };
}
