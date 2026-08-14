        <Label className="mb-1.5 block">{field.label}</Label>
        <RichTextEditor
          value={value ?? ""}
          onChange={onChange}
          autosaveKey={autosaveKey}
          placeholder={field.placeholder}
        />
      </div>
    );
  }
  return (
    <div>
      <Label className="mb-1.5 block">{field.label}</Label>
      {field.type === "textarea" ? (
        <Textarea
          rows={4}
          value={value ?? ""}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "array" ? (
        <Textarea
          rows={4}
          value={Array.isArray(value) ? (value as string[]).join("\n") : (value ?? "")}
          placeholder={field.placeholder ?? "One per line"}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "number" ? (
        <div className="relative">
          {iconEl && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">{iconEl}</span>}
          <Input
            type="number"
            value={value ?? 0}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={iconEl ? "pl-9" : ""}
          />
        </div>
      ) : (
        <div className="relative">
          {iconEl && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40">{iconEl}</span>}
          <Input
            value={value ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className={iconEl ? "pl-9" : ""}
          />
        </div>
      )}
    </div>
  );
}
function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <ImageUploader label={label} value={value} onChange={onChange} />;
}
