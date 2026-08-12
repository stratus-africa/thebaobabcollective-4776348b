import DOMPurify from "dompurify";

/** Tags/attributes allowed in stored rich-text content. */
const CONFIG = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "sup",
    "sub",
    "h1",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "blockquote",
    "hr",
    "a",
    "img",
    "figure",
    "figcaption",
    "span",
    "div",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "title", "src", "alt", "width", "height", "loading", "class"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i,
  FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
  FORBID_ATTR: ["onerror", "onclick", "onload", "onmouseover", "onfocus"],
  ADD_ATTR: ["target", "rel"],
};

/** Sanitize untrusted HTML for both storage and render. Safe on SSR. */
export function sanitizeHtml(input: string): string {
  if (!input) return "";
  if (typeof window === "undefined") {
    // Preserve rich-text structure during SSR while removing the riskiest
    // constructs. The browser pass below still uses DOMPurify for full cleanup.
    return String(input)
      .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
      .replace(/<\s*\/?\s*(script|style|iframe|object|embed)[^>]*>/gi, "")
      .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s+(href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\2/gi, "");
  }
  const clean = DOMPurify.sanitize(input, CONFIG) as unknown as string;

  // Force safe target/rel on external links.
  const wrap = document.createElement("div");
  wrap.innerHTML = clean;
  wrap.querySelectorAll("a").forEach((a) => {
    const href = a.getAttribute("href") ?? "";
    const isExternal = /^https?:\/\//i.test(href);
    if (isExternal || a.getAttribute("target") === "_blank") {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
  });
  return wrap.innerHTML;
}
