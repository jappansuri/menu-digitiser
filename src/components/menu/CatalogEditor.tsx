import { useMemo } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ClipboardCopy,
  FileJson,
  FolderPlus,
  Plus,
  RotateCcw,
  Sheet,
  Store,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ItemEditor } from "./ItemEditor";
import {
  catalogToCsv,
  catalogToJson,
  countItems,
  countNeedsReview,
  emptyCategory,
  emptyItem,
  type MenuCatalog,
  type MenuCategory,
  type MenuItem,
} from "@/lib/menu-types";

interface CatalogEditorProps {
  catalog: MenuCatalog;
  onChange: (catalog: MenuCatalog) => void;
  onReset: () => void;
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function CatalogEditor({ catalog, onChange, onReset }: CatalogEditorProps) {
  const totalItems = useMemo(() => countItems(catalog), [catalog]);
  const reviewCount = useMemo(() => countNeedsReview(catalog), [catalog]);
  const fileBase = (catalog.restaurantName || "menu-catalog")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const setCategory = (id: string, patch: Partial<MenuCategory>) =>
    onChange({
      ...catalog,
      categories: catalog.categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });

  const setItem = (catId: string, item: MenuItem) =>
    onChange({
      ...catalog,
      categories: catalog.categories.map((c) =>
        c.id === catId ? { ...c, items: c.items.map((i) => (i.id === item.id ? item : i)) } : c,
      ),
    });

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="rounded-2xl border bg-paper p-5 shadow-[var(--shadow-soft)] sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Store className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Catalog</span>
            </div>
            <Input
              value={catalog.restaurantName}
              placeholder="Restaurant name"
              onChange={(e) => onChange({ ...catalog, restaurantName: e.target.value })}
              className="h-auto border-transparent bg-transparent px-0 font-display text-3xl font-semibold shadow-none focus-visible:ring-0 md:text-4xl"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{catalog.categories.length} categories</Badge>
              <Badge variant="secondary">{totalItems} items</Badge>
              {reviewCount > 0 && (
                <Badge
                  variant="outline"
                  className="gap-1 border-amber-400 text-amber-700 dark:text-amber-300"
                >
                  <AlertTriangle className="h-3 w-3" /> {reviewCount} need
                  {reviewCount === 1 ? "s" : ""} review
                </Badge>
              )}
              <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1">
                <span className="text-xs text-muted-foreground">Currency</span>
                <span className="text-xs font-semibold uppercase">{catalog.currency}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(catalogToJson(catalog));
                toast.success("Catalog JSON copied to clipboard");
              }}
            >
              <ClipboardCopy /> Copy JSON
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                download(`${fileBase}.csv`, catalogToCsv(catalog), "text/csv");
                toast.success("CSV exported");
              }}
            >
              <Sheet /> Export CSV
            </Button>
            <Button
              variant="hero"
              onClick={() => {
                download(`${fileBase}.json`, catalogToJson(catalog), "application/json");
                toast.success("JSON exported");
              }}
            >
              <FileJson /> Export JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {catalog.categories.map((category) => (
          <section key={category.id}>
            <div className="mb-3 flex items-center gap-2">
              <Input
                value={category.name}
                onChange={(e) => setCategory(category.id, { name: e.target.value })}
                className="h-auto max-w-sm border-transparent bg-transparent px-0 font-display text-xl font-semibold shadow-none focus-visible:ring-0"
              />
              <span className="h-px flex-1 bg-border" />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete category"
                onClick={() =>
                  onChange({
                    ...catalog,
                    categories: catalog.categories.filter((c) => c.id !== category.id),
                  })
                }
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              {category.items.map((item) => (
                <ItemEditor
                  key={item.id}
                  item={item}
                  currency={catalog.currency}
                  onChange={(next) => setItem(category.id, next)}
                  onDelete={() =>
                    setCategory(category.id, {
                      items: category.items.filter((i) => i.id !== item.id),
                    })
                  }
                />
              ))}
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() =>
                  setCategory(category.id, { items: [...category.items, emptyItem()] })
                }
              >
                <Plus /> Add item to {category.name || "category"}
              </Button>
            </div>
          </section>
        ))}
      </div>

      {/* Footer actions */}
      <div className="flex flex-col gap-3 border-t pt-6 sm:flex-row sm:justify-between">
        <Button
          variant="secondary"
          onClick={() =>
            onChange({ ...catalog, categories: [...catalog.categories, emptyCategory()] })
          }
        >
          <FolderPlus /> Add category
        </Button>
        <Button variant="ghost" onClick={onReset} className="text-muted-foreground">
          <RotateCcw /> Scan another menu
        </Button>
      </div>
    </div>
  );
}
