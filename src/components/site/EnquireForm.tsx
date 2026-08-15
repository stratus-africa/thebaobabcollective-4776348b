import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, CheckCircle2, ArrowRight, Save, X, Calendar, Users, Sparkles, MapPin, Compass } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { submitEnquiry } from "@/lib/submissions.functions";
import { useFormAutosave } from "@/hooks/use-form-autosave";

export type EnquireFormProps = {
  defaultSubject?: string;
  defaultDestination?: string;
  sourceUrl?: string;
  compact?: boolean;
  className?: string;
  /** localStorage key for autosave. Set null to disable. Defaults to a key per subject. */
  autosaveKey?: string | null;
  /** Context card shown at the top of the form, prefilled from the page (journey/destination). */
  context?: {
    kind?: "Journey" | "Destination" | "Itinerary" | "Lodge";
    title: string;
    dates?: string;
    slug?: string;
    image?: string;
  };
};

type Draft = {
  name: string;
  email: string;
  phone: string;
  travel_dates: string;
  adults: number;
  children: number;
  trip_type: string;
  budget: string;
  message: string;
  subscribe: boolean;
};

const EMPTY_DRAFT: Draft = {
  name: "",
  email: "",
  phone: "",
  travel_dates: "",
  adults: 2,
  children: 0,
  trip_type: "",
  budget: "",
  message: "",
  subscribe: true,
};

const TRIP_TYPES = [
  "Safari & Wildlife",
  "Beach & Safari",
  "Honeymoon",
  "Family Adventure",
  "Photography Safari",
  "Culture & Connection",
  "The Great Migration",
  "Bespoke / Custom",
];

const BUDGET_RANGES = [
  "Under $5,000 pp",
  "$5,000 - $10,000 pp",
  "$10,000 - $15,000 pp",
  "$15,000+ pp",
  "Flexible / Custom",
];

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateField(name: keyof Draft, value: any): string | undefined {
  switch (name) {
    case "name":
      return typeof value === "string" && value.trim().length === 0 ? "Please tell us your name." : undefined;
    case "email":
      if (!value || typeof value !== "string" || value.trim().length === 0) return "Email is required.";
      if (!emailRe.test(value.trim())) return "Enter a valid email address.";
      return undefined;
    case "phone":
      return !value || typeof value !== "string" || value.trim().length < 5
        ? "Phone number is required so our team can reach you."
        : undefined;
    case "message":
      return !value || typeof value !== "string" || value.trim().length < 5
        ? "Tell us a few words about your travel dreams."
        : undefined;
    default:
      return undefined;
  }
}

export function EnquireForm({
  defaultSubject,
  defaultDestination,
  sourceUrl,
  compact,
  className,
  autosaveKey,
  context,
}: EnquireFormProps) {
  const submit = useServerFn(submitEnquiry);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft | "form", string>>>({});
  const [honeypot, setHoneypot] = useState("");
  const mountedAt = useRef<number>(Date.now());

  const storageKey = useMemo(() => {
    if (autosaveKey === null) return null;
    if (autosaveKey) return autosaveKey;
    return `enquiry:${defaultSubject ?? "general"}`;
  }, [autosaveKey, defaultSubject]);

  const autosave = useFormAutosave<Draft>({
    key: storageKey ?? "_disabled",
    enabled: storageKey !== null,
  });

  const [values, setValues] = useState<Draft>({
    ...EMPTY_DRAFT,
    travel_dates: context?.dates ?? "",
    message: context?.title
      ? `I would love to learn more about planning a journey for ${context.kind ? `${context.kind.toLowerCase()} ` : ""}"${context.title}". Please share availability, recommended rhythm and how we can shape this around our preferences.`
      : "",
  });
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    if (autosave.draft) {
      setValues((prev) => ({ ...prev, ...autosave.draft! }));
      hydratedRef.current = true;
    }
  }, [autosave.draft]);

  useEffect(() => {
    if (storageKey === null) return;
    if (submitted) return;
    autosave.save(values);
  }, [values, storageKey, submitted, autosave]);

  function setField<K extends keyof Draft>(k: K, v: Draft[K]) {
    setValues((prev) => ({ ...prev, [k]: v }));
  }

  function blurValidate(name: keyof Draft) {
    const v = values[name];
    const err = validateField(name, v);
    setErrors((prev) => ({ ...prev, [name]: err }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (honeypot.trim() !== "") {
      setSubmitted(true);
      return;
    }
    if (Date.now() - mountedAt.current < 1500) {
      setErrors({ form: "Please take a moment to review your details before submitting." });
      return;
    }

    const next: typeof errors = {};
    (["name", "email", "phone", "message"] as const).forEach((f) => {
      const err = validateField(f, values[f]);
      if (err) next[f] = err;
    });

    if (Object.keys(next).length) {
      setErrors(next);
      const first = Object.keys(next)[0];
      const el = document.getElementById(first);
      el?.focus();
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await submit({
        data: {
          company: "",
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim(),
          destination: defaultDestination || context?.title || "",
          subject: defaultSubject ?? "Website Enquiry",
          travel_dates: values.travel_dates.trim() || (context?.dates ?? ""),
          adults: Number(values.adults) || 2,
          children: Number(values.children) || 0,
          trip_type: values.trip_type || undefined,
          budget: values.budget || undefined,
          subscribe_newsletter: values.subscribe,
          source_url: sourceUrl ?? (typeof window !== "undefined" ? window.location.href : ""),
          message: values.message.trim(),
        },
      });
      autosave.clear();
      setSubmitted(true);
      toast.success("Enquiry sent — Michael & Samra will be in touch within 24 hours.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setErrors({ form: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function startAnother() {
    setValues({ ...EMPTY_DRAFT });
    setErrors({});
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <div
        className={`bg-background border border-border p-8 sm:p-12 text-center rounded-xl ${className ?? ""}`}
        role="status"
        aria-live="polite"
      >
        <CheckCircle2 className="w-16 h-16 text-gold mx-auto mb-6" strokeWidth={1.2} aria-hidden="true" />
        <h3 className="font-serif text-3xl sm:text-4xl text-foreground mb-3">Thank You</h3>
        <p className="text-foreground/80 max-w-md mx-auto mb-8 text-base leading-relaxed">
          Your enquiry has been received. Michael, Samra or one of our dedicated journey designers will review your
          preferences and reach out within 24 hours.
        </p>
        <button
          type="button"
          onClick={startAnother}
          className="inline-flex items-center gap-2 rounded-full border border-gold text-gold uppercase tracking-[0.22em] text-[11px] font-semibold px-8 py-3.5 hover:bg-gold hover:text-gold-foreground transition-colors"
        >
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-busy={loading}
      className={`bg-background border border-border p-6 md:p-10 rounded-xl space-y-8 ${className ?? ""}`}
    >
      {/* Honeypot */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}
      >
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {defaultSubject && (
        <div className="flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase text-gold font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Tailored Journey Request — {defaultSubject}</span>
        </div>
      )}

      {context && (
        <div className="flex items-center gap-4 border border-gold/30 bg-gold/5 p-4 rounded-xl">
          {context.image && (
            <img
              src={context.image}
              alt=""
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-border shrink-0"
            />
          )}
          <div className="min-w-0 flex-1">
            {context.kind && (
              <p className="text-[10px] tracking-[0.25em] uppercase text-gold font-semibold mb-1">
                Selected {context.kind}
              </p>
            )}
            <p className="font-serif text-xl text-foreground leading-tight truncate">{context.title}</p>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground/70">
              {context.dates && <span>Dates: {context.dates}</span>}
            </div>
          </div>
        </div>
      )}

      {autosave.showRestoredNotice && (
        <div
          role="status"
          className="flex items-start gap-3 border border-gold/40 bg-gold/5 px-4 py-3 rounded-lg text-xs text-foreground/80"
        >
          <Save className="w-4 h-4 text-gold mt-0.5 shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-foreground font-medium">Draft restored</p>
            <p className="text-foreground/60">We restored what you typed earlier.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              autosave.clear();
              setValues({ ...EMPTY_DRAFT });
            }}
            className="text-foreground/60 hover:text-foreground inline-flex items-center gap-1 text-[11px]"
            aria-label="Discard saved draft"
          >
            <X className="w-3 h-3" /> Discard
          </button>
        </div>
      )}

      {/* 1. Traveller Contact Info */}
      <fieldset className="space-y-4">
        <legend className="font-serif text-2xl text-foreground mb-3 flex items-center gap-2">
          <span>01</span> <span className="text-foreground/40">—</span> <span>Your Details</span>
        </legend>
        <div className="grid md:grid-cols-3 gap-4">
          <Field
            label="Full name"
            name="name"
            required
            value={values.name}
            onChange={(v) => setField("name", v)}
            onBlur={() => blurValidate("name")}
            error={errors.name}
            placeholder="e.g. Sarah Jenkins"
          />
          <Field
            label="Email address"
            name="email"
            type="email"
            required
            value={values.email}
            onChange={(v) => setField("email", v)}
            onBlur={() => blurValidate("email")}
            error={errors.email}
            placeholder="sarah@example.com"
          />
          <Field
            label="Phone / WhatsApp"
            name="phone"
            type="tel"
            required
            value={values.phone}
            onChange={(v) => setField("phone", v)}
            onBlur={() => blurValidate("phone")}
            error={errors.phone}
            placeholder="+44 7700 900077"
          />
        </div>
      </fieldset>

      {/* 2. Journey Shape & Timing */}
      <fieldset className="space-y-4 pt-4 border-t border-border/50">
        <legend className="font-serif text-2xl text-foreground mb-3 flex items-center gap-2">
          <span>02</span> <span className="text-foreground/40">—</span> <span>Journey Preferences</span>
        </legend>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <Label
              htmlFor="travel_dates"
              className="text-xs uppercase tracking-wider text-foreground/70 font-semibold mb-1.5 block"
            >
              Estimated Travel Dates
            </Label>
            <Input
              id="travel_dates"
              name="travel_dates"
              placeholder="e.g. July 2026 / Approx 10 days"
              value={values.travel_dates}
              onChange={(e) => setField("travel_dates", e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label
              htmlFor="trip_type"
              className="text-xs uppercase tracking-wider text-foreground/70 font-semibold mb-1.5 block"
            >
              Journey Type
            </Label>
            <select
              id="trip_type"
              name="trip_type"
              value={values.trip_type}
              onChange={(e) => setField("trip_type", e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">Select a travel style…</option>
              {TRIP_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label
              htmlFor="budget"
              className="text-xs uppercase tracking-wider text-foreground/70 font-semibold mb-1.5 block"
            >
              Approximate Budget
            </Label>
            <select
              id="budget"
              name="budget"
              value={values.budget}
              onChange={(e) => setField("budget", e.target.value)}
              className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-gold"
            >
              <option value="">Select budget range…</option>
              {BUDGET_RANGES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <Label
              htmlFor="adults"
              className="text-xs uppercase tracking-wider text-foreground/70 font-semibold mb-1.5 block"
            >
              Adults
            </Label>
            <Input
              id="adults"
              name="adults"
              type="number"
              min={1}
              max={30}
              value={values.adults}
              onChange={(e) => setField("adults", parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
          <div>
            <Label
              htmlFor="children"
              className="text-xs uppercase tracking-wider text-foreground/70 font-semibold mb-1.5 block"
            >
              Children
            </Label>
            <Input
              id="children"
              name="children"
              type="number"
              min={0}
              max={20}
              value={values.children}
              onChange={(e) => setField("children", parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>
      </fieldset>

      {/* 3. Dream Vision */}
      <div className="pt-4 border-t border-border/50 space-y-2">
        <Label htmlFor="message" className="font-serif text-2xl text-foreground mb-2 block">
          03 — Tell Us About Your Dream Journey <span className="text-terracotta">*</span>
        </Label>
        <p className="text-xs text-foreground/60 mb-2">
          Share any must-see wildlife, special occasions (honeymoon, anniversary, milestone birthday), preferred pace,
          or dietary preferences.
        </p>
        <Textarea
          id="message"
          name="message"
          required
          rows={5}
          className="mt-2"
          placeholder="e.g. We are looking for an intimate, off-the-beaten-track Kenya safari with sunrise walks in the Mara and three nights relaxing on the coast…"
          value={values.message}
          onChange={(e) => setField("message", e.target.value)}
          onBlur={() => blurValidate("message")}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
        />
        {errors.message && (
          <p id="message-error" role="alert" className="mt-1 text-xs text-destructive">
            {errors.message}
          </p>
        )}
      </div>

      <label className="flex items-start gap-3 text-sm text-foreground/75 cursor-pointer pt-2">
        <Checkbox
          checked={values.subscribe}
          onCheckedChange={(v) => setField("subscribe", v === true)}
          className="mt-0.5"
        />
        <span>Receive occasional thoughtful journey ideas and conservation notes from The Baobab Collective.</span>
      </label>

      {errors.form && (
        <p
          role="alert"
          className="text-sm text-destructive border border-destructive/40 bg-destructive/5 px-4 py-3 rounded-lg"
        >
          {errors.form}
        </p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gold text-gold-foreground uppercase tracking-[0.24em] text-[12px] font-semibold py-4 hover:bg-gold/90 transition-colors shadow-md disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Sending Your Journey Request…
            </>
          ) : (
            <>
              <span>Send Journey Request</span> <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </>
          )}
        </button>
      </div>

      <p className="text-[11px] text-foreground/50 text-center">
        We respond within 24 hours, Monday to Saturday. Your details are kept strictly confidential.
        {storageKey !== null && " Draft automatically saves as you type."}
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  error,
  placeholder,
  value,
  onChange,
  onBlur,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}) {
  const errorId = error ? `${name}-error` : undefined;
  return (
    <div>
      <Label htmlFor={name} className="text-xs uppercase tracking-wider text-foreground/70 font-semibold mb-1.5 block">
        {label}{" "}
        {required && (
          <span className="text-terracotta" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      <Input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder ?? label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className="mt-1"
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
