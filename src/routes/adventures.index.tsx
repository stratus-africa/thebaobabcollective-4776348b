    <section className="py-24 bg-cream">
      <div className="max-w-[1920px] mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-32">
            <p className="text-[11px] tracking-[0.3em] uppercase text-gold mb-4">{content.rhythm_eyebrow}</p>
            <h2 className="font-serif text-4xl md:text-5xl text-foreground mb-6">{content.rhythm_title}</h2>
            <p className="text-foreground/70 leading-relaxed">{content.rhythm_body}</p>
          </div>
          <ol className="lg:col-span-8 space-y-10">
            {rhythm.map((r, i) => (
              <li
                key={r.when}
                className="grid grid-cols-[5.5rem_1fr] md:grid-cols-[6.5rem_1fr] gap-6 md:gap-10 items-start"
              >
                <div className="text-left pt-1">
                  <div className="font-serif text-4xl text-terracotta leading-none">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="text-[11px] tracking-[0.25em] uppercase text-foreground/55 mt-2">{r.when}</div>
                </div>
                <div className="border-l border-border pl-6 md:pl-8">
                  <h3 className="font-serif text-2xl text-foreground mb-2">{r.title}</h3>
                  <p className="text-foreground/70 leading-relaxed">{r.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
function CtaSection({ cta }: { cta: AdventuresPage["cta"] }) {
  return (
    <section className="bg-forest text-forest-foreground py-24 text-center">
      <div className="max-w-2xl mx-auto px-6">
        <p className="text-[11px] tracking-[0.3em] uppercase text-gold mb-5">{cta.eyebrow}</p>
        <h2 className="font-serif text-4xl md:text-5xl mb-5">{cta.headline}</h2>
        <p className="text-forest-foreground/80 mb-8 leading-relaxed">{cta.body}</p>
        <EnquireDialog
          defaultSubject="Adventures — Start Planning"
          trigger={
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-gold text-gold-foreground uppercase tracking-[0.25em] text-[12px] px-8 py-4 hover:bg-gold/90"
            >
              {cta.buttonLabel} <ArrowRight className="w-3 h-3" />
            </button>
          }
        />
      </div>
    </section>
  );
}
