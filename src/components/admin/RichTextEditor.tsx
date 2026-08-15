import { useEffect, useRef, useState } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered,
  Heading2, Heading3, Link as LinkIcon, Link2Off, Quote, Image as ImageIcon,
  Undo2, Redo2, Sliders, Sparkles, RemoveFormatting, Loader2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminUploadImage } from "@/lib/admin.functions";
import { sanitizeHtml } from "@/lib/sanitize-html";

type Mode = "simple" | "advanced";

type Props = {
  value: string;
  onChange: (html: string) => void;
  autosaveKey?: string;
  placeholder?: string;
  minHeight?: number;
  defaultMode?: Mode;
};

/**
 * Contenteditable rich text editor.
 * - Sanitizes with DOMPurify on every change before emitting.
 * - Simple / Advanced toolbar modes.
 * - Image upload via adminUploadImage (admin only).
 * - Link insert / unlink dialog.
 * - Autosaves to localStorage under `autosaveKey`.
 */
export function RichTextEditor({
  value,
  onChange,
  autosaveKey,
  placeholder = "Write your story…",
  minHeight = 200,
  defaultMode = "simple",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [showRestored, setShowRestored] = useState(false);
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [uploading, setUploading] = useState(false);
  const [insertingLink, setInsertingLink] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const initial = useRef(value);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useServerFn(adminUploadImage);
  const busy = uploading || insertingLink;

  // Initialise once on mount.
  useEffect(() => {
    if (!ref.current) return;
    let html = value ?? "";
    if (autosaveKey) {
      try {
        const draft = localStorage.getItem(autosaveKey);
        if (draft && draft !== html) {
          html = draft;
          setShowRestored(true);
          onChange(sanitizeHtml(draft));
        }
      } catch {}
    }
    const safe = sanitizeHtml(html);
    if (ref.current.innerHTML !== safe) ref.current.innerHTML = safe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reflect external value changes (switching record etc.).
  useEffect(() => {
    if (!ref.current) return;
    if (initial.current !== value) {
      const safe = sanitizeHtml(value ?? "");
      if (ref.current.innerHTML !== safe) ref.current.innerHTML = safe;
      initial.current = value;
    }
  }, [value]);

  // Debounced autosave.
  useEffect(() => {
    if (!autosaveKey) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(autosaveKey, value ?? "");
        setSavedAt(Date.now());
      } catch {}
    }, 500);
    return () => clearTimeout(t);
  }, [value, autosaveKey]);

  function emit() {
    if (!ref.current) return;
    onChange(sanitizeHtml(ref.current.innerHTML));
  }

  function exec(cmd: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  }

  /** Wrap the current selection (or whole block) in a font-size class. */
  function applySize(size: string) {
    ref.current?.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) {
      // No selection: apply to the whole editor content as the base size.
      if (!ref.current) return;
      ref.current.querySelectorAll("[class*='rt-size-']").forEach((el) => {
        el.className = el.className.replace(/rt-size-\S+/g, "").trim();
        if (!el.className) el.removeAttribute("class");
      });
      if (size !== "md") {
        ref.current.innerHTML = `<span class="rt-size-${size}">${ref.current.innerHTML}</span>`;
      }
      emit();
      return;
    }
    const frag = range.cloneContents();
    const holder = document.createElement("div");
    holder.appendChild(frag);
    holder.querySelectorAll("[class*='rt-size-']").forEach((el) => {
      el.className = el.className.replace(/rt-size-\S+/g, "").trim();
      if (!el.className) el.removeAttribute("class");
    });
    const html =
      size === "md" ? holder.innerHTML : `<span class="rt-size-${size}">${holder.innerHTML}</span>`;
    document.execCommand("insertHTML", false, html);
    emit();
  }

  function insertLink() {
    setInsertingLink(true);
    try {
      const sel = window.getSelection();
      const current = sel?.toString() ?? "";
      const url = window.prompt("Link URL (https://…, mailto:, tel:)", "https://");
      if (!url) return;
      if (!/^(https?:|mailto:|tel:|\/|#)/i.test(url)) {
        toast.error("Unsupported URL — use https://, mailto:, tel:, or a site path.");
        return;
      }
      if (current.length === 0) {
        const label = window.prompt("Link text", url) ?? url;
        ref.current?.focus();
        document.execCommand(
          "insertHTML",
          false,
          `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`,
        );
      } else {
        document.execCommand("createLink", false, url);
        const anchor = sel?.anchorNode?.parentElement?.closest("a");
        if (anchor) {
          anchor.setAttribute("target", "_blank");
          anchor.setAttribute("rel", "noopener noreferrer");
        }
      }
      emit();
    } finally {
      setInsertingLink(false);
    }
  }

  function unlink() {
    exec("unlink");
  }

  async function onPickImage(file: File) {
    if (!/^image\/(png|jpe?g|webp|gif|avif)/i.test(file.type)) {
      toast.error("Choose a PNG, JPG, WEBP, GIF, or AVIF image.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be smaller than 8MB.");
      return;
    }
    setUploading(true);
    // Simulated progress — server function doesn't stream, so drive an
    // indeterminate bar that gets close-but-not-100% until the call resolves.
    setUploadProgress(5);
    const tick = window.setInterval(() => {
      setUploadProgress((p) => (p === null ? 5 : Math.min(90, p + Math.max(1, (95 - p) * 0.15))));
    }, 180);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
      const res = await upload({
        data: {
          filename: file.name,
          contentType: file.type || "image/png",
          base64: btoa(binary),
        },
      });
      setUploadProgress(100);
      const alt = window.prompt("Describe this image for accessibility", "") ?? "";
      ref.current?.focus();
      document.execCommand(
        "insertHTML",
        false,
        `<img src="${escapeAttr(res.url)}" alt="${escapeAttr(alt)}" loading="lazy" />`,
      );
      emit();
      toast.success("Image added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      window.clearInterval(tick);
      setUploading(false);
      setUploadProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function insertImageByUrl() {
    const url = window.prompt("Image URL (https://…)", "https://");
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error("URL must start with https://");
      return;
    }
    const alt = window.prompt("Describe this image for accessibility", "") ?? "";
    ref.current?.focus();
    document.execCommand(
      "insertHTML",
      false,
      `<img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" loading="lazy" />`,
    );
    emit();
  }

  function clearDraft() {
    if (autosaveKey) {
      try { localStorage.removeItem(autosaveKey); } catch {}
    }
    setShowRestored(false);
  }

  return (
    <div className="border border-border bg-background" aria-busy={busy || undefined}>
      <div
        role="toolbar"
        aria-label={mode === "advanced" ? "Rich text editor toolbar — advanced" : "Rich text editor toolbar"}
        aria-controls={undefined}
        className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-border bg-cream/40"
      >
        <ToolbarBtn onClick={() => exec("bold")} title="Bold" ariaLabel="Bold" disabled={busy}><Bold className="w-3.5 h-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("italic")} title="Italic" ariaLabel="Italic" disabled={busy}><Italic className="w-3.5 h-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("formatBlock", "<h2>")} title="Heading" ariaLabel="Heading level 2" disabled={busy}><Heading2 className="w-3.5 h-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("insertUnorderedList")} title="Bullet list" ariaLabel="Bullet list" disabled={busy}><List className="w-3.5 h-3.5" /></ToolbarBtn>
        <ToolbarBtn onClick={() => exec("insertOrderedList")} title="Numbered list" ariaLabel="Numbered list" disabled={busy}><ListOrdered className="w-3.5 h-3.5" /></ToolbarBtn>
        <label className="sr-only" htmlFor="rt-size">Font size</label>
        <select
          id="rt-size"
          defaultValue=""
          onChange={(e) => {
            const v = e.target.value;
            e.currentTarget.value = "";
            if (v) applySize(v);
          }}
          disabled={busy}
          title="Font size"
          aria-label="Font size"
          className="h-7 rounded border border-border bg-background px-1.5 text-[11px] text-foreground/80 focus-visible:outline-2 focus-visible:outline-gold"
        >
          <option value="">Size</option>
          <option value="xs">Extra small</option>
          <option value="sm">Small</option>
          <option value="md">Normal</option>
          <option value="lg">Large</option>
          <option value="xl">Extra large</option>
          <option value="2xl">Huge</option>
        </select>
        <ToolbarBtn onClick={insertLink} title="Insert link" ariaLabel="Insert link" disabled={busy}>
          {insertingLink ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LinkIcon className="w-3.5 h-3.5" />}
        </ToolbarBtn>

        {mode === "advanced" && (
          <>
            <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
            <ToolbarBtn onClick={() => exec("underline")} title="Underline" ariaLabel="Underline" disabled={busy}><UnderlineIcon className="w-3.5 h-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec("strikeThrough")} title="Strikethrough" ariaLabel="Strikethrough" disabled={busy}><Strikethrough className="w-3.5 h-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec("formatBlock", "<h3>")} title="Sub-heading" ariaLabel="Heading level 3" disabled={busy}><Heading3 className="w-3.5 h-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec("formatBlock", "<blockquote>")} title="Quote" ariaLabel="Blockquote" disabled={busy}><Quote className="w-3.5 h-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={unlink} title="Remove link" ariaLabel="Remove link" disabled={busy}><Link2Off className="w-3.5 h-3.5" /></ToolbarBtn>
            <ToolbarBtn
              onClick={() => fileRef.current?.click()}
              title="Upload image"
              ariaLabel="Upload image"
              disabled={busy}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
            </ToolbarBtn>
            <ToolbarBtn onClick={insertImageByUrl} title="Insert image by URL" ariaLabel="Insert image by URL" disabled={busy}>
              <span className="text-[10px] font-semibold tracking-wider">URL</span>
            </ToolbarBtn>
            <ToolbarBtn onClick={() => exec("removeFormat")} title="Clear formatting" ariaLabel="Clear formatting" disabled={busy}>
              <RemoveFormatting className="w-3.5 h-3.5" />
            </ToolbarBtn>
            <ToolbarBtn onClick={() => exec("undo")} title="Undo" ariaLabel="Undo" disabled={busy}><Undo2 className="w-3.5 h-3.5" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec("redo")} title="Redo" ariaLabel="Redo" disabled={busy}><Redo2 className="w-3.5 h-3.5" /></ToolbarBtn>
          </>
        )}

        <div className="ml-auto flex items-center gap-3 text-[10px] text-foreground/50">
          {showRestored && (
            <button type="button" onClick={clearDraft} className="underline hover:text-foreground focus-visible:outline-2 focus-visible:outline-gold">
              Restored draft · clear
            </button>
          )}
          {savedAt && !showRestored && <span aria-live="polite">Autosaved</span>}
          <button
            type="button"
            onClick={() => setMode((m) => (m === "simple" ? "advanced" : "simple"))}
            className="inline-flex items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[10px] tracking-wider uppercase text-foreground/70 hover:text-foreground focus-visible:outline-2 focus-visible:outline-gold"
            title={mode === "simple" ? "Switch to advanced toolbar" : "Switch to simple toolbar"}
            aria-label={mode === "simple" ? "Switch to advanced toolbar" : "Switch to simple toolbar"}
            aria-pressed={mode === "advanced"}
            disabled={busy}
          >
            {mode === "simple" ? <Sliders className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
            {mode === "simple" ? "Advanced" : "Simple"}
          </button>
        </div>
      </div>

      {/* Upload / insert progress bar */}
      {busy && (
        <div
          role="progressbar"
          aria-label={uploading ? "Uploading image" : "Inserting link"}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={uploadProgress ?? undefined}
          className="h-1 w-full bg-cream/60 overflow-hidden"
        >
          <div
            className="h-full bg-gold transition-[width] duration-200 ease-out"
            style={{ width: uploadProgress != null ? `${uploadProgress}%` : "35%" }}
          />
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => e.target.files?.[0] && onPickImage(e.target.files[0])}
      />

      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label={placeholder}
        aria-disabled={busy || undefined}
        contentEditable={!busy}
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          // Force plain-text paste to avoid unsafe styles / tracking.
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          emit();
        }}
        suppressContentEditableWarning
        className="p-3 text-sm leading-relaxed outline-none prose-sm max-w-none [&_h2]:font-serif [&_h2]:text-lg [&_h2]:mt-3 [&_h3]:font-serif [&_h3]:text-base [&_h3]:mt-2 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-gold [&_blockquote]:pl-3 [&_blockquote]:italic [&_a]:text-gold [&_a]:underline [&_img]:my-2 [&_img]:max-w-full [&_img]:h-auto"
        data-placeholder={placeholder}
        style={{ minHeight }}
      />
      {busy && (
        <p className="px-3 pb-2 text-[11px] text-foreground/60" aria-live="polite">
          {uploading ? "Uploading image…" : "Inserting link…"}
        </p>
      )}
      <style>{`[contenteditable][data-placeholder]:empty:before{content:attr(data-placeholder);color:hsl(var(--muted-foreground));opacity:.5}`}</style>
    </div>
  );
}

function ToolbarBtn({
  onClick, title, ariaLabel, children, disabled,
}: {
  onClick: () => void; title: string; ariaLabel?: string; children: React.ReactNode; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={ariaLabel ?? title}
      disabled={disabled}
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick(); }}
      className="p-1.5 rounded hover:bg-background text-foreground/70 hover:text-foreground focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

function escapeAttr(s: string) {
  return s.replace(/[&"'<>]/g, (c) => ({ "&": "&amp;", '"': "&quot;", "'": "&#39;", "<": "&lt;", ">": "&gt;" }[c]!));
}
function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
}
