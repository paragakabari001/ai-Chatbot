import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

export function renderMarkdown(raw) {
  if (!raw) return "";
  let html = marked.parse(raw);
  html = html.replace(
    /<a\s+([^>]*href=["']https?:\/\/[^"']+["'][^>]*)>/gi,
    (match, attrs) => `<a ${attrs}><span class="ext-icon">🔗</span>`
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
