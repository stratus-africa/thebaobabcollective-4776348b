import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { getMenuConfig, saveMenuConfig, MENU_DEFAULTS, type MenuConfig } from "@/lib/menu.functions";
import { MENU_CONFIG_QUERY_KEY } from "@/hooks/useMenuConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  GripVertical,
  IndentIncrease,
  Outdent,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  component: MenuEditor,
});

function MenuEditor() {
  const fetchFn = useServerFn(getMenuConfig);
  const saveFn = useServerFn(saveMenuConfig);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "menu_config"], queryFn: () => fetchFn() });
  const [draft, setDraft] = useState<MenuConfig>(MENU_DEFAULTS);

  useEffect(() => {
    if (data) setDraft({ ...MENU_DEFAULTS, ...data });
  }, [data]);

  const mSave = useMutation({
    mutationFn: () => saveFn({ data: draft }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "menu_config"] });
      qc.invalidateQueries({ queryKey: MENU_CONFIG_QUERY_KEY });
      toast.success("Menu saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Could not save"),
  });

  function reset() {
    if (!confirm("Reset the menu to defaults? Save to apply.")) return;
    setDraft(MENU_DEFAULTS);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="font-serif text-3xl">Menu &amp; Navigation</h1>
          <p className="text-sm text-foreground/60 mt-1">
            Edit the main menu, submenus, CTA and footer links. Save to see changes in the preview.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>
            <RefreshCw className="w-4 h-4 mr-1" /> Reset
          </Button>
          <Button
            onClick={() => mSave.mutate()}
            disabled={mSave.isPending || isLoading}
            className="bg-gold text-gold-foreground hover:bg-gold/90"
          >
            {mSave.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-background border border-border p-10 text-center text-foreground/60">
          <Loader2 className="w-5 h-5 animate-spin inline mr-2" /> Loading…
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,600px)] gap-6">
          <div className="space-y-8">
            {/* Top bar */}
            <Section title="Top Announcement Bar">
              <div className="flex items-center gap-3 mb-3">
                <Switch
                  checked={draft.topBarEnabled}
                  onCheckedChange={(v) => setDraft({ ...draft, topBarEnabled: v })}
                />
                <Label>Show top bar</Label>
              </div>
              <Label>Text</Label>
              <Input value={draft.topBarText} onChange={(e) => setDraft({ ...draft, topBarText: e.target.value })} />
            </Section>

            <Section title="Header Style">
              <div className="flex items-center gap-3">
                <Switch
                  checked={draft.transparentOverHero}
                  onCheckedChange={(v) => setDraft({ ...draft, transparentOverHero: v })}
                />
                <Label>Overlay menu on hero (clear background)</Label>
              </div>
              <p className="text-xs text-foreground/60 mt-2">
                When enabled, the main menu floats on top of hero sections with a transparent background across all
                pages.
              </p>
            </Section>

            {/* Primary nav */}
            <Section title="Main Navigation">
              <ItemList
                items={draft.primary}
                onChange={(items) => setDraft({ ...draft, primary: items })}
                allowChildren
              />
            </Section>

            {/* More dropdown */}
            <Section title="'More' Dropdown">
              <ItemList items={draft.more} onChange={(items) => setDraft({ ...draft, more: items })} />
            </Section>

            {/* CTA */}
            <Section title="Header CTA Button">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Label</Label>
                  <Input value={draft.ctaLabel} onChange={(e) => setDraft({ ...draft, ctaLabel: e.target.value })} />
                </div>
                <div>
                  <Label>
                    Link URL <span className="text-foreground/50">(leave blank to open Enquire dialog)</span>
                  </Label>
                  <Input
                    value={draft.ctaTo}
                    placeholder="/contact"
                    onChange={(e) => setDraft({ ...draft, ctaTo: e.target.value })}
                  />
                </div>
              </div>
            </Section>

            {/* Footer columns */}
            <Section title="Footer">
              <Label>Footer tagline</Label>
              <Input
                value={draft.footerTagline}
                onChange={(e) => setDraft({ ...draft, footerTagline: e.target.value })}
                className="mb-6"
              />
              <div className="space-y-6">
                {draft.footerColumns.map((col, idx) => (
                  <div key={idx} className="border border-border rounded p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Input
                        value={col.heading}
                        onChange={(e) => {
                          const cols = [...draft.footerColumns];
                          cols[idx] = { ...cols[idx], heading: e.target.value };
                          setDraft({ ...draft, footerColumns: cols });
                        }}
                        placeholder="Column heading"
                        className="max-w-sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const cols = draft.footerColumns.filter((_, i) => i !== idx);
                          setDraft({ ...draft, footerColumns: cols });
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {col.links.map((l, li) => (
                        <div key={li} className="flex gap-2 items-center">
                          <Input
                            value={l.label}
                            placeholder="Label"
                            onChange={(e) => {
                              const cols = [...draft.footerColumns];
                              const links = [...cols[idx].links];
                              links[li] = { ...links[li], label: e.target.value };
                              cols[idx] = { ...cols[idx], links };
                              setDraft({ ...draft, footerColumns: cols });
                            }}
                          />
                          <Input
                            value={l.to}
                            placeholder="/path"
                            onChange={(e) => {
                              const cols = [...draft.footerColumns];
                              const links = [...cols[idx].links];
                              links[li] = { ...links[li], to: e.target.value };
                              cols[idx] = { ...cols[idx], links };
                              setDraft({ ...draft, footerColumns: cols });
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const cols = [...draft.footerColumns];
                              const links = cols[idx].links.filter((_, i) => i !== li);
                              cols[idx] = { ...cols[idx], links };
                              setDraft({ ...draft, footerColumns: cols });
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const cols = [...draft.footerColumns];
                          cols[idx] = { ...cols[idx], links: [...cols[idx].links, { label: "New link", to: "/" }] };
                          setDraft({ ...draft, footerColumns: cols });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" /> Add link
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      footerColumns: [...draft.footerColumns, { heading: "New Column", links: [] }],
                    })
                  }
                >
                  <Plus className="w-4 h-4 mr-1" /> Add column
                </Button>
              </div>
            </Section>
          </div>
          <MenuPreviewPanel savedAt={mSave.isSuccess ? mSave.submittedAt : 0} />
        </div>
      )}
    </div>
  );
}

function MenuPreviewPanel({ savedAt }: { savedAt: number }) {
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (savedAt) setNonce((n) => n + 1);
  }, [savedAt]);
  return (
    <div className="border border-border bg-muted/30 flex flex-col min-h-[600px] sticky top-4">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border bg-background">
        <div className="text-[11px] tracking-[0.2em] uppercase text-foreground/60">Preview · saved state</div>
        <Button variant="ghost" size="sm" onClick={() => setNonce((n) => n + 1)}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>
      <iframe key={nonce} title="Menu preview" src="/" className="flex-1 w-full bg-background" />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-background border border-border p-5 sm:p-6">
      <h2 className="font-serif text-xl mb-4">{title}</h2>
      {children}
    </div>
  );
}

type ItemLike = {
  label: string;
  to: string;
  hidden?: boolean;
  children?: { label: string; to: string; hidden?: boolean }[];
};

type SortableMenuRow = {
  id: string;
  depth: number;
  item: ItemLike;
};

const PAGE_OPTIONS = [
  { label: "Home", value: "/" },
  { label: "Destinations", value: "/destinations" },
  { label: "Adventures", value: "/adventures" },
  { label: "Journal", value: "/journal" },
  { label: "About", value: "/about" },
  { label: "Contact", value: "/contact" },
  { label: "Private Travel", value: "/private-travel" },
  { label: "Testimonials", value: "/testimonials" },
  { label: "Lodges", value: "/lodges" },
  { label: "FAQ", value: "/faq" },
  { label: "Custom URL", value: "__custom__" },
];

function flattenMenuTree(items: ItemLike[], depth = 0, parentId = "root"): SortableMenuRow[] {
  return items.flatMap((item, index) => {
    const id = `${parentId}-${index}`;
    const row: SortableMenuRow = { id, depth, item };
    const children = item.children ?? [];
    return [row, ...flattenMenuTree(children, depth + 1, id)];
  });
}

function rebuildMenuTree(rows: SortableMenuRow[]): ItemLike[] {
  const root: ItemLike[] = [];
  const stack: Array<{ depth: number; array: ItemLike[] }> = [{ depth: -1, array: root }];

  for (const row of rows) {
    while (stack.length > row.depth + 1) {
      stack.pop();
    }

    const item: ItemLike = {
      ...row.item,
      children: [],
    };

    const parent = stack[stack.length - 1]?.array ?? root;
    parent.push(item);
    stack.push({ depth: row.depth + 1, array: item.children! });
  }

  return root;
}

function ItemList<T extends ItemLike>({
  items,
  onChange,
  allowChildren,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  allowChildren?: boolean;
}) {
  const rows = allowChildren
    ? flattenMenuTree(items)
    : items.map((item, index) => ({ id: `row-${index}`, depth: 0, item }));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function updateRows(nextRows: SortableMenuRow[]) {
    onChange(rebuildMenuTree(nextRows) as T[]);
  }

  function moveRow(id: string, direction: -1 | 1) {
    const nextRows = [...rows];
    const index = nextRows.findIndex((row) => row.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= nextRows.length) return;
    updateRows(arrayMove(nextRows, index, target));
  }

  function changeRow(id: string, patch: Partial<ItemLike>) {
    const nextRows = rows.map((row) => (row.id === id ? { ...row, item: { ...row.item, ...patch } } : row));
    updateRows(nextRows);
  }

  function indentRow(id: string) {
    if (!allowChildren) return;
    const nextRows = [...rows];
    const index = nextRows.findIndex((row) => row.id === id);
    if (index <= 0) return;

    const current = nextRows[index];
    const previous = nextRows[index - 1];
    current.depth = Math.min(previous.depth + 1, Math.max(current.depth, 0));
    updateRows(nextRows);
  }

  function outdentRow(id: string) {
    if (!allowChildren) return;
    const nextRows = [...rows];
    const index = nextRows.findIndex((row) => row.id === id);
    if (index < 0) return;
    const current = nextRows[index];
    current.depth = Math.max(0, current.depth - 1);
    updateRows(nextRows);
  }

  function removeRow(id: string) {
    const nextRows = rows.filter((row) => row.id !== id);
    updateRows(nextRows);
  }

  function addRow() {
    const newItem: T = { label: "New item", to: "/" } as T;
    const nextRows = [...rows, { id: `new-${Date.now()}`, depth: 0, item: newItem }];
    updateRows(nextRows);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = rows.findIndex((row) => row.id === String(active.id));
    const newIndex = rows.findIndex((row) => row.id === String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    updateRows(arrayMove(rows, oldIndex, newIndex));
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
      >
        <SortableContext items={rows.map((row) => row.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {rows.map((row, index) => (
              <SortableMenuRow
                key={row.id}
                row={row}
                rowIndex={index}
                allowChildren={!!allowChildren}
                onDelete={() => removeRow(row.id)}
                onMoveUp={() => moveRow(row.id, -1)}
                onMoveDown={() => moveRow(row.id, 1)}
                onIndent={() => indentRow(row.id)}
                onOutdent={() => outdentRow(row.id)}
                onChange={(patch) => changeRow(row.id, patch)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      <Button variant="outline" onClick={addRow}>
        <Plus className="w-4 h-4 mr-1" /> Add item
      </Button>
    </div>
  );
}

function SortableMenuRow({
  row,
  rowIndex,
  allowChildren,
  onDelete,
  onMoveUp,
  onMoveDown,
  onIndent,
  onOutdent,
  onChange,
}: {
  row: SortableMenuRow;
  rowIndex: number;
  allowChildren: boolean;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onIndent: () => void;
  onOutdent: () => void;
  onChange: (patch: Partial<ItemLike>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  };

  const selectedPageValue = PAGE_OPTIONS.find((option) => option.value === row.item.to)?.value ?? "__custom__";

  return (
    <div ref={setNodeRef} style={style} className="border border-border rounded-lg bg-background p-3">
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={`Reorder ${row.item.label || "menu item"}`}
          className="mt-1 cursor-grab active:cursor-grabbing rounded-md border border-border bg-cream/50 text-foreground/60 h-10 w-10 flex items-center justify-center"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0" style={{ marginLeft: row.depth * 18 }}>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              placeholder="Label"
              value={row.item.label}
              onChange={(e) => onChange({ label: e.target.value })}
              className="flex-1 min-w-[140px]"
            />

            <div className="w-full md:w-[230px]">
              <Select
                value={selectedPageValue}
                onValueChange={(value) => {
                  if (value === "__custom__") return;
                  const matched = PAGE_OPTIONS.find((option) => option.value === value);
                  onChange({
                    to: value,
                    label: matched ? matched.label : row.item.label,
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a page" />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="/path"
              value={row.item.to}
              onChange={(e) => onChange({ to: e.target.value })}
              className="flex-1 min-w-[120px]"
            />
            <label className="flex items-center gap-2 text-xs text-foreground/70">
              <Switch checked={!row.item.hidden} onCheckedChange={(checked) => onChange({ hidden: !checked })} />
              Visible
            </label>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onMoveUp}
            disabled={rowIndex === 0}
            aria-label="Move up"
          >
            <ChevronUp className="w-4 h-4" />
          </Button>
          <Button type="button" variant="outline" size="icon" onClick={onMoveDown} aria-label="Move down">
            <ChevronDown className="w-4 h-4" />
          </Button>
          {allowChildren && (
            <>
              <Button type="button" variant="outline" size="icon" onClick={onIndent} aria-label="Indent submenu">
                <IndentIncrease className="w-4 h-4" />
              </Button>
              <Button type="button" variant="outline" size="icon" onClick={onOutdent} aria-label="Outdent submenu">
                <Outdent className="w-4 h-4" />
              </Button>
            </>
          )}
          <Button type="button" variant="ghost" size="icon" onClick={onDelete} aria-label="Delete item">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
