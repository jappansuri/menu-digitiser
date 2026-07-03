import { useState } from "react";
import { AlertTriangle, ChevronDown, Layers, Plus, Trash2, UtensilsCrossed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Dietary, MenuItem, MenuModifier, MenuVariant } from "@/lib/menu-types";

interface ItemEditorProps {
  item: MenuItem;
  currency: string;
  onChange: (item: MenuItem) => void;
  onDelete: () => void;
}

function priceValue(p: number | null): string {
  return p == null ? "" : String(p);
}

function parsePrice(v: string): number | null {
  if (v.trim() === "") return null;
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

const DIETARY_LABEL: Record<NonNullable<Dietary>, string> = {
  veg: "Vegetarian",
  nonveg: "Non-vegetarian",
};

function DietaryMark({ value, onChange }: { value: Dietary; onChange: (v: Dietary) => void }) {
  const cycle = () => onChange(value === "veg" ? "nonveg" : value === "nonveg" ? null : "veg");
  const title =
    value === null ? "Dietary marker not set — click to add" : DIETARY_LABEL[value];

  return (
    <button
      type="button"
      onClick={cycle}
      title={title}
      aria-label={title}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm"
    >
      {value === null ? (
        <svg viewBox="0 0 16 16" className="h-4 w-4 text-muted-foreground/40">
          <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2,2" />
        </svg>
      ) : value === "veg" ? (
        <svg viewBox="0 0 16 16" className="h-4 w-4">
          <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="#0f8a3f" strokeWidth="1.4" />
          <circle cx="8" cy="8" r="4" fill="#0f8a3f" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" className="h-4 w-4">
          <rect x="1" y="1" width="14" height="14" rx="2" fill="none" stroke="#8a2f1f" strokeWidth="1.4" />
          <polygon points="8,3.5 13,12.5 3,12.5" fill="#8a2f1f" />
        </svg>
      )}
    </button>
  );
}

export function ItemEditor({ item, currency, onChange, onDelete }: ItemEditorProps) {
  const [open, setOpen] = useState(false);

  const update = (patch: Partial<MenuItem>) => onChange({ ...item, ...patch });

  const setVariant = (idx: number, patch: Partial<MenuVariant>) =>
    update({ variants: item.variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)) });
  const setAddon = (idx: number, patch: Partial<MenuModifier>) =>
    update({ addons: item.addons.map((a, i) => (i === idx ? { ...a, ...patch } : a)) });

  const detailCount = item.variants.length + item.addons.length + (item.isCombo ? 1 : 0);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-[var(--shadow-soft)]",
        item.needsReview && "border-amber-400/70 ring-1 ring-amber-400/40",
      )}
    >
      {item.needsReview && (
        <div className="flex items-start justify-between gap-2 rounded-t-xl border-b border-amber-400/40 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          <span className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="font-semibold">Needs review</span>
              {item.reviewNote ? ` — ${item.reviewNote}` : " — low confidence, please verify."}
            </span>
          </span>
          <button
            type="button"
            onClick={() => update({ needsReview: false })}
            className="shrink-0 whitespace-nowrap font-medium underline decoration-dotted hover:text-amber-950 dark:hover:text-amber-100"
          >
            Mark reviewed
          </button>
        </div>
      )}
      <div className="flex items-start gap-3 p-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <DietaryMark value={item.dietary} onChange={(dietary) => update({ dietary })} />
            <Input
              value={item.name}
              placeholder="Item name"
              onChange={(e) => update({ name: e.target.value })}
              className="h-9 max-w-xs flex-1 border-transparent bg-muted/60 font-display text-base font-semibold focus-visible:bg-background"
            />
            {item.isCombo && (
              <Badge variant="secondary" className="gap-1">
                <Layers className="h-3 w-3" /> Combo
              </Badge>
            )}
          </div>
          <Textarea
            value={item.description}
            placeholder="Description (optional)"
            onChange={(e) => update({ description: e.target.value })}
            rows={1}
            className="min-h-0 resize-none border-transparent bg-muted/40 text-sm text-muted-foreground focus-visible:bg-background"
          />
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-muted/60 px-2">
            <span className="text-xs font-medium text-muted-foreground">{currency}</span>
            <Input
              value={priceValue(item.price)}
              placeholder="0.00"
              inputMode="decimal"
              onChange={(e) => update({ price: parsePrice(e.target.value) })}
              className="h-9 w-20 border-transparent bg-transparent text-right font-semibold focus-visible:bg-background"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete item"
            onClick={onDelete}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between border-t px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="flex items-center gap-1.5">
          <UtensilsCrossed className="h-3.5 w-3.5" />
          {detailCount > 0
            ? `${detailCount} modifier${detailCount > 1 ? "s" : ""} — sizes, add-ons & combo`
            : "Add sizes, add-ons & combo"}
        </span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-5 border-t bg-muted/20 p-4">
          {/* Variants */}
          <ModifierList
            title="Sizes / Variants"
            currency={currency}
            rows={item.variants}
            pricePrefix=""
            onAdd={() => update({ variants: [...item.variants, { name: "", price: null }] })}
            onRemove={(idx) => update({ variants: item.variants.filter((_, i) => i !== idx) })}
            onName={(idx, name) => setVariant(idx, { name })}
            onPrice={(idx, price) => setVariant(idx, { price })}
            placeholder="e.g. Large"
          />

          {/* Add-ons */}
          <ModifierList
            title="Add-ons / Extras"
            currency={currency}
            rows={item.addons}
            pricePrefix="+"
            onAdd={() => update({ addons: [...item.addons, { name: "", price: null }] })}
            onRemove={(idx) => update({ addons: item.addons.filter((_, i) => i !== idx) })}
            onName={(idx, name) => setAddon(idx, { name })}
            onPrice={(idx, price) => setAddon(idx, { price })}
            placeholder="e.g. Extra cheese"
          />

          {/* Combo */}
          <div className="rounded-lg border bg-card p-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Layers className="h-4 w-4 text-primary" /> This item is a combo / meal
              </span>
              <Switch
                checked={item.isCombo}
                onCheckedChange={(checked) => update({ isCombo: checked })}
              />
            </div>
            {item.isCombo && (
              <Textarea
                value={item.comboIncludes.join(", ")}
                placeholder="What's included, comma-separated (e.g. Burger, Fries, Drink)"
                rows={2}
                onChange={(e) =>
                  update({
                    comboIncludes: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                className="mt-3 resize-none bg-muted/40 text-sm"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ModifierListProps {
  title: string;
  currency: string;
  rows: { name: string; price: number | null }[];
  pricePrefix: string;
  placeholder: string;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onName: (idx: number, name: string) => void;
  onPrice: (idx: number, price: number | null) => void;
}

function ModifierList({
  title,
  currency,
  rows,
  pricePrefix,
  placeholder,
  onAdd,
  onRemove,
  onName,
  onPrice,
}: ModifierListProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </span>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-primary" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" /> Add
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">None</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={row.name}
                placeholder={placeholder}
                onChange={(e) => onName(idx, e.target.value)}
                className="h-8 flex-1 bg-card text-sm"
              />
              <div className="flex items-center gap-1 rounded-md bg-card px-2">
                <span className="text-xs text-muted-foreground">
                  {pricePrefix}
                  {currency}
                </span>
                <Input
                  value={priceValue(row.price)}
                  placeholder="0.00"
                  inputMode="decimal"
                  onChange={(e) => onPrice(idx, parsePrice(e.target.value))}
                  className="h-8 w-16 border-transparent bg-transparent px-1 text-right text-sm"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove"
                onClick={() => onRemove(idx)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
