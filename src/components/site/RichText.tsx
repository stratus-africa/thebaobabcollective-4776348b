import { sanitizeHtml } from "@/lib/sanitize-html";
import { cn } from "@/lib/utils";

export function RichText({ html, className }: { html?: string | null; className?: string }) {
  const safeHtml = sanitizeHtml(html ?? "");

  if (!safeHtml) return null;

  return (
    <div
      className={cn(
        "rich-text leading-relaxed [&_*:first-child]:mt-0 [&_*:last-child]:mb-0 [&_a]:text-gold [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:border-l-2 [&_blockquote]:border-gold [&_blockquote]:pl-4 [&_blockquote]:italic [&_h2]:font-serif [&_h2]:text-3xl [&_h2]:leading-tight [&_h3]:font-serif [&_h3]:text-2xl [&_h3]:leading-tight [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
