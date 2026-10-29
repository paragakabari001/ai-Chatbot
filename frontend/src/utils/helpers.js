import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

export function renderMarkdown(raw) {
  if (!raw || typeof raw !== 'string') return "";
  try {
    let html = marked.parse(raw);

    // Replace all links with auto-fetched live website favicons and secure attributes
    html = html.replace(
      /<a\s+([^>]*href=["'](https?:\/\/([^"'/\s]+)[^"']*)["'][^>]*)>/gi,
      (match, attrs, fullUrl, host) => {
        try {
          const cleanHost = (host || "").replace(/^www\./, '');
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${cleanHost}&sz=32`;
          const fallbackUrl = `https://icons.duckduckgo.com/ip3/${cleanHost}.ico`;
          const targetRel = attrs && attrs.includes("target=") ? "" : ` target="_blank" rel="noopener noreferrer"`;

          return `<a ${attrs}${targetRel} class="inline-link"><img src="${faviconUrl}" alt="" class="ext-favicon inline-block w-3.5 h-3.5 mr-1 align-text-bottom rounded-sm flex-shrink-0" onerror="this.onerror=null;this.src='${fallbackUrl}';this.onerror=function(){this.style.display='none';};" />`;
        } catch {
          return match;
        }
      }
    );

    return html;
  } catch (err) {
    console.error("renderMarkdown parse error:", err);
    return raw;
  }
}

export function stripMarkdown(text) {
  if (!text || typeof text !== 'string') return "";
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
    if (!Array.isArray(parsed)) return [];

    // Thorough sanitization to prevent any malformed object from crashing React
    return parsed
      .filter(s => s && typeof s === 'object' && typeof s.id === 'string')
      .map(s => ({
        id: s.id,
        title: typeof s.title === 'string' ? s.title : "Real Estate Consultation",
        ts: typeof s.ts === 'number' ? s.ts : Date.now(),
        messages: Array.isArray(s.messages)
          ? s.messages
              .filter(m => m && typeof m === 'object' && typeof m.role === 'string')
              .map(m => ({
                id: m.id || Date.now(),
                role: m.role,
                content: typeof m.content === 'string' ? m.content : "",
                citations: Array.isArray(m.citations)
                  ? m.citations.filter(c => c && typeof c === 'object')
                  : [],
                isError: Boolean(m.isError),
                failedQuery: m.failedQuery || ""
              }))
          : []
      }));
  } catch (err) {
    console.warn("Failed to parse history from localStorage:", err);
    return [];
  }
}

export function saveHistory(sessions) {
  try {
    if (Array.isArray(sessions)) {
      localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(sessions));
    }
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
    if (id && typeof id === 'string') localStorage.setItem(LS_CURRENT_ID_KEY, id);
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
