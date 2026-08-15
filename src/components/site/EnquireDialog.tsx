import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Mail, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EnquireForm, type EnquireFormProps } from "@/components/site/EnquireForm";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export type EnquireDialogProps = EnquireFormProps & {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  description?: string;
  /** Auto-open when the URL hash matches (e.g. "enquire"). Also syncs the URL when toggled. */
  openOnHash?: string;
};

export function EnquireDialog({
  trigger,
  open: openProp,
  onOpenChange,
  title = "Speak with a Journey Designer",
  description,
  openOnHash,
  defaultSubject,
  defaultDestination,
  sourceUrl,
  compact,
  autosaveKey,
  context,
}: EnquireDialogProps) {
  const isControlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? openProp! : internalOpen;
  const lastSyncedHash = useRef<string | null>(null);

  const { email: contactEmail, phone: contactPhone, phoneTel: contactPhoneTel } = useSiteSettings();

  const setOpen = useCallback(
    (v: boolean) => {
      if (!isControlled) setInternalOpen(v);
      onOpenChange?.(v);
    },
    [isControlled, onOpenChange],
  );

  // Auto-open from URL hash on mount + react to client-side hash changes (no reload).
  useEffect(() => {
    if (!openOnHash || typeof window === "undefined") return;
    const sync = () => {
      const current = window.location.hash.replace("#", "");
      if (current === openOnHash) setOpen(true);
    };
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, [openOnHash, setOpen]);

  // Keep URL hash in sync with open state — replaceState so we don't pollute history.
  useEffect(() => {
    if (!openOnHash || typeof window === "undefined") return;
    const target = `#${openOnHash}`;
    const current = window.location.hash;
    if (open && current !== target) {
      lastSyncedHash.current = target;
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${window.location.search}${target}`,
      );
    } else if (!open && current === target) {
      lastSyncedHash.current = "";
      window.history.replaceState(window.history.state, "", `${window.location.pathname}${window.location.search}`);
    }
  }, [open, openOnHash]);

  const desc =
    description ??
    (defaultSubject
      ? `Share a few details about your ${defaultSubject} journey — we'll respond within 24 hours.`
      : "Tell us about your dream journey — we'll respond within 24 hours.");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent
        aria-describedby="enquire-dialog-desc"
        className="p-0 gap-0 max-w-3xl w-[calc(100vw-1.5rem)] sm:w-full max-h-[92vh] overflow-hidden flex flex-col"
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border text-left">
          <DialogTitle className="font-serif text-2xl md:text-3xl text-foreground">{title}</DialogTitle>
          <DialogDescription id="enquire-dialog-desc" className="text-sm text-foreground/70">
            {desc}
          </DialogDescription>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-foreground/75">
            <a
              href={`mailto:${contactEmail}`}
              className="inline-flex items-center gap-2 hover:text-gold transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
              {contactEmail}
            </a>
            <a
              href={`tel:${contactPhoneTel}`}
              className="inline-flex items-center gap-2 hover:text-gold transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-gold" aria-hidden="true" />
              {contactPhone}
            </a>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto">
          <EnquireForm
            defaultSubject={defaultSubject}
            defaultDestination={defaultDestination}
            sourceUrl={sourceUrl}
            compact={compact}
            autosaveKey={autosaveKey}
            context={context}
            className="!border-0 !bg-transparent !p-4 sm:!p-6"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
