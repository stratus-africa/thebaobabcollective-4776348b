import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicMediaUrl, uploadMedia } from "@/lib/media-storage";
import { toast } from "sonner";

type Props = {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  disabled?: boolean;
};

export function ImageUploader({ value, onChange, label, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [displayed, setDisplayed] = useState<string | null>(value ?? null);

  useEffect(() => {
    setDisplayed(value ?? null);
  }, [value]);

  const handleSelect = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setUploading(true);

      const result = await uploadMedia(file);

      if (!result?.url) {
        throw new Error("Image upload failed");
      }

      setDisplayed(result.url);
      onChange(result.url);

      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error(error);

      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleRemove = () => {
    if (disabled || uploading) return;

    setDisplayed(null);
    onChange("");
  };

  return (
    <div className="space-y-3">
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
        disabled={disabled || uploading}
      />

      {displayed ? (
        <div className="relative overflow-hidden rounded-lg border bg-muted">
          <img
            src={getPublicMediaUrl(displayed)}
            alt={label ?? "Selected image"}
            className="h-auto w-full object-cover"
          />

          <button
            type="button"
            onClick={handleRemove}
            disabled={disabled || uploading}
            aria-label="Remove image"
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-background/90 shadow-sm transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="h-32 w-full rounded-lg border-dashed"
          onClick={handleSelect}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <ImagePlus className="mr-2 h-5 w-5" />
              Select / Upload Image
            </>
          )}
        </Button>
      )}
    </div>
  );
}
