import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { FolderOpen, Loader2, RefreshCw, Upload, X, Image as ImageIcon, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { adminUploadImage, adminDeleteMedia } from "@/lib/admin.functions";
import { MediaLibraryPicker, MEDIA_LIBRARY_QUERY_KEY } from "@/components/admin/MediaLibraryPicker";

type UploadFn = (args: {
  data: { filename: string; contentType: string; base64: string };
}) => Promise<{ url: string; path?: string }>;

export type ImageUploaderProps = {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  /** override the default upload endpoint (defaults to `adminUploadImage`) */
  uploadFn?: UploadFn;
  /** MB */
  maxSizeMB?: number;
  accept?: string;
  /** Compact preview-in-corner layout (used inside table rows / small forms) */
  compact?: boolean;
  /** Hide the "or paste a URL" fallback input */
  hideUrlInput?: boolean;
  className?: string;
};

const DEFAULT_ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/avif";
const ACCEPT_REGEX = /^image\/(png|jpe?g|webp|gif|avif|svg\+xml)$/i;

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

async function readAsBase64(
  file: File,
  onProgress: (pct: number) => void,
): Promise<{ base64: string; contentType: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable) onProgress(Math.round((ev.loaded / ev.total) * 100));
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve({ base64, contentType: file.type || "image/jpeg", filename: file.name });
    };
    reader.readAsDataURL(file);
  });
}

export function ImageUploader({
  label,
  value,
  onChange,
  uploadFn,
  maxSizeMB = 8,
  accept = DEFAULT_ACCEPT,
  compact = false,
  hideUrlInput = false,
  className,
}: ImageUploaderProps) {
  const defaultUpload = useServerFn(adminUploadImage) as unknown as UploadFn;
  const deleteMedia = useServerFn(adminDeleteMedia);
  const queryClient = useQueryClient();
  const upload = uploadFn ?? defaultUpload;


  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ name: string; size: number } | null>(null);
  const [drag, setDrag] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function setLocalPreview(file: File | null) {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setPreview(url);
  }

  async function deletePrevious(url: string | undefined) {
    if (!url) return;
    if (!/\/api\/public\/media\//.test(url)) return;
    try {
      await deleteMedia({ data: { url } });
    } catch {
      // swallow — user-visible state (value) already changed
    }
  }

  async function handleFile(file: File | undefined | null) {
    setError(null);
    if (!file) return;
    if (!ACCEPT_REGEX.test(file.type)) {
      setError("Choose a PNG, JPG, WEBP, GIF, AVIF, or SVG image.");
      return;
    }
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Image must be under ${maxSizeMB}MB. This file is ${humanSize(file.size)}.`);
      return;
    }
    setLocalPreview(file);
    setMeta({ name: file.name, size: file.size });
    setUploading(true);
    setProgress(0);

    // Simulated network progress while awaiting the RPC — real upload is a
    // single JSON POST, so we tick the bar until the server responds and then
    // finish it. Better UX than an indeterminate spinner.
    let simulated = 0;
    const ticker = window.setInterval(() => {
      simulated = Math.min(90, simulated + Math.random() * 8);
      setProgress((p) => Math.max(p, Math.min(90, 25 + simulated * 0.65)));
    }, 200);

    const previousUrl = value;
    try {
      const payload = await readAsBase64(file, (pct) => setProgress(Math.round(pct * 0.25)));
      const res = await upload({ data: payload });
      window.clearInterval(ticker);
      setProgress(100);
      onChange(res.url);
      toast.success("Image uploaded");
      // Refresh media-library cache so new uploads appear in the picker.
      queryClient.invalidateQueries({ queryKey: MEDIA_LIBRARY_QUERY_KEY });
      // Fire-and-forget cleanup of the previous file in storage.
      void deletePrevious(previousUrl && previousUrl !== res.url ? previousUrl : undefined);
    } catch (e: unknown) {
      window.clearInterval(ticker);
      const msg = e instanceof Error ? e.message : "Upload failed";
      setError(msg);
      setLocalPreview(null);
      setMeta(null);
    } finally {
      setUploading(false);
      window.setTimeout(() => setProgress(0), 600);
    }
  }

  async function handleRemove() {
    const prev = value;
    onChange("");
    setLocalPreview(null);
    setMeta(null);
    setError(null);
    await deletePrevious(prev);
  }

  const displayed = preview ?? value;

  return (
    <div className={className}>
      {label && (
        <Label className="mb-2 block text-[11px] tracking-[0.2em] uppercase text-foreground/60">
          {label}
        </Label>
      )}

      {displayed ? (
        <div className="border-2 border-border rounded-md overflow-hidden bg-background">
          <div className={`relative bg-cream ${compact ? "" : ""}`}>
            <img
              src={displayed}
              alt="Preview"
              className={`w-full ${compact ? "max-h-40" : "max-h-80"} object-contain mx-auto`}
            />
            {uploading && (
              <div className="absolute inset-x-0 bottom-0 bg-background/90 backdrop-blur p-3 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-foreground/70">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                  </span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 p-3 border-t border-border bg-cream/40">
            <UploadButton onPick={handleFile} disabled={uploading} accept={accept} variant="replace" />
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              disabled={uploading}
              className="inline-flex items-center gap-1 text-xs px-3 py-2 border border-border rounded-md hover:bg-cream disabled:opacity-50"
            >
              <FolderOpen className="w-3.5 h-3.5" /> Library
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="inline-flex items-center gap-1 text-xs px-3 py-2 border border-border rounded-md hover:bg-destructive hover:text-destructive-foreground hover:border-destructive disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" /> Remove
            </button>
            <span className="ml-auto text-[11px] text-foreground/50 truncate max-w-[60%]" title={meta?.name ?? value}>
              {meta ? `${meta.name} · ${humanSize(meta.size)}` : value.split("/").pop()}
            </span>
          </div>
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex flex-col items-center justify-center gap-3 cursor-pointer rounded-md border-2 border-dashed px-6 ${
            compact ? "py-6" : "py-12"
          } text-center transition-colors ${
            drag ? "border-gold bg-gold/5" : "border-border bg-cream/40 hover:border-gold hover:bg-gold/5"
          }`}
        >
          <div className="h-12 w-12 rounded-full bg-gold/10 text-gold flex items-center justify-center">
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-sm font-medium">
              {uploading ? "Uploading…" : "Drop an image here or click to upload"}
            </p>
            <p className="text-[11px] text-foreground/50 mt-1">
              PNG, JPG, WEBP, GIF, AVIF · up to {maxSizeMB}MB
            </p>
          </div>
          {uploading && (
            <div className="w-full max-w-xs space-y-1">
              <Progress value={progress} className="h-1.5" />
              <p className="text-[10px] text-foreground/50">{progress}%</p>
            </div>
          )}
          <input
            type="file"
            accept={accept}
            className="hidden"
            disabled={uploading}
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPickerOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-foreground/70 hover:text-gold underline-offset-2 hover:underline"
          >
            <FolderOpen className="w-3.5 h-3.5" /> Choose from library
          </button>
        </label>
      )}

      {!hideUrlInput && (
        <div className="mt-3">
          <Input
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste an image URL"
            className="text-xs"
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive mt-2 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </p>
      )}

      <MediaLibraryPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(urls) => {
          const [url] = urls;
          if (url) {
            onChange(url);
            setPreview(null);
            setMeta(null);
            setError(null);
          }
        }}
      />
    </div>
  );
}

function UploadButton({
  onPick,
  disabled,
  accept,
  variant,
}: {
  onPick: (f: File | undefined) => void;
  disabled?: boolean;
  accept: string;
  variant: "upload" | "replace";
}) {
  return (
    <label
      className={`inline-flex items-center gap-1 text-xs cursor-pointer px-3 py-1.5 rounded-md border ${
        variant === "replace"
          ? "bg-background/95 border-border hover:bg-cream"
          : "bg-gold text-gold-foreground border-gold hover:bg-gold/90"
      } ${disabled ? "opacity-50 cursor-wait" : ""}`}
    >
      {variant === "replace" ? <RefreshCw className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
      {variant === "replace" ? "Replace" : "Choose image"}
      <input
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => onPick(e.target.files?.[0])}
      />
    </label>
  );
}
