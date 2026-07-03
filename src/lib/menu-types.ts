// Shared, client-safe catalog types and helpers.

export const DEFAULT_CURRENCY = "INR";

export interface MenuVariant {
  name: string;
  price: number | null;
}

export interface MenuModifier {
  name: string;
  price: number | null;
}

export type Dietary = "veg" | "nonveg" | null;

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number | null;
  variants: MenuVariant[];
  addons: MenuModifier[];
  isCombo: boolean;
  comboIncludes: string[];
  needsReview: boolean;
  reviewNote: string;
  dietary: Dietary;
}

export interface MenuCategory {
  id: string;
  name: string;
  items: MenuItem[];
}

export interface MenuCatalog {
  restaurantName: string;
  currency: string;
  categories: MenuCategory[];
}

let idCounter = 0;
export function makeId(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value);
}

function dietary(value: unknown): Dietary {
  const v = str(value).toLowerCase();
  if (v === "veg" || v === "vegetarian") return "veg";
  if (v === "nonveg" || v === "non-veg" || v === "non vegetarian" || v === "non-vegetarian")
    return "nonveg";
  return null;
}

/** Normalize arbitrary parsed JSON into a well-formed MenuCatalog. */
export function normalizeCatalog(raw: unknown): MenuCatalog {
  const root = (raw ?? {}) as Record<string, unknown>;
  const categoriesRaw = Array.isArray(root.categories) ? root.categories : [];

  const categories: MenuCategory[] = categoriesRaw.map((c) => {
    const cat = (c ?? {}) as Record<string, unknown>;
    const itemsRaw = Array.isArray(cat.items) ? cat.items : [];
    const items: MenuItem[] = itemsRaw.map((i) => {
      const it = (i ?? {}) as Record<string, unknown>;
      const variantsRaw = Array.isArray(it.variants) ? it.variants : [];
      const addonsRaw = Array.isArray(it.addons) ? it.addons : [];
      const comboRaw = Array.isArray(it.comboIncludes) ? it.comboIncludes : [];
      return {
        id: makeId("item"),
        name: str(it.name),
        description: str(it.description),
        price: num(it.price),
        variants: variantsRaw.map((v) => {
          const vv = (v ?? {}) as Record<string, unknown>;
          return { name: str(vv.name), price: num(vv.price) };
        }),
        addons: addonsRaw.map((a) => {
          const aa = (a ?? {}) as Record<string, unknown>;
          return { name: str(aa.name), price: num(aa.price) };
        }),
        isCombo: Boolean(it.isCombo),
        comboIncludes: comboRaw.map((x) => str(x)).filter(Boolean),
        needsReview: Boolean(it.needsReview),
        reviewNote: str(it.reviewNote),
        dietary: dietary(it.dietary),
      };
    });
    return { id: makeId("cat"), name: str(cat.name) || "Uncategorized", items };
  });

  const detectedCurrency = str(root.currency).toUpperCase();
  const currency = detectedCurrency || DEFAULT_CURRENCY;

  return {
    restaurantName: str(root.restaurantName),
    currency,
    categories,
  };
}

export function emptyItem(): MenuItem {
  return {
    id: makeId("item"),
    name: "",
    description: "",
    price: null,
    variants: [],
    addons: [],
    isCombo: false,
    comboIncludes: [],
    needsReview: false,
    reviewNote: "",
    dietary: null,
  };
}

export function emptyCategory(): MenuCategory {
  return { id: makeId("cat"), name: "New category", items: [] };
}

export function countItems(catalog: MenuCatalog): number {
  return catalog.categories.reduce((sum, c) => sum + c.items.length, 0);
}

export function countNeedsReview(catalog: MenuCatalog): number {
  return catalog.categories.reduce(
    (sum, c) => sum + c.items.filter((i) => i.needsReview).length,
    0,
  );
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** Import-ready flat CSV: one row per item. */
export function catalogToCsv(catalog: MenuCatalog): string {
  const header = [
    "Category",
    "Item",
    "Description",
    "Price",
    "Currency",
    "Variants",
    "Add-ons",
    "Is Combo",
    "Combo Includes",
    "Dietary",
    "Needs Review",
    "Review Note",
  ];
  const rows: string[] = [header.map(csvEscape).join(",")];

  for (const cat of catalog.categories) {
    for (const item of cat.items) {
      const variants = item.variants
        .map((v) => `${v.name}${v.price != null ? ` (${v.price})` : ""}`)
        .join("; ");
      const addons = item.addons
        .map((a) => `${a.name}${a.price != null ? ` (+${a.price})` : ""}`)
        .join("; ");
      rows.push(
        [
          cat.name,
          item.name,
          item.description,
          item.price != null ? String(item.price) : "",
          catalog.currency,
          variants,
          addons,
          item.isCombo ? "Yes" : "No",
          item.comboIncludes.join("; "),
          item.dietary === "veg" ? "Veg" : item.dietary === "nonveg" ? "Non-veg" : "",
          item.needsReview ? "Yes" : "No",
          item.reviewNote,
        ]
          .map((f) => csvEscape(String(f)))
          .join(","),
      );
    }
  }
  return rows.join("\n");
}

/** Clean export JSON (strips internal ids). */
export function catalogToJson(catalog: MenuCatalog): string {
  const clean = {
    restaurantName: catalog.restaurantName,
    currency: catalog.currency,
    categories: catalog.categories.map((c) => ({
      name: c.name,
      items: c.items.map((i) => ({
        name: i.name,
        description: i.description,
        price: i.price,
        variants: i.variants,
        addons: i.addons,
        isCombo: i.isCombo,
        comboIncludes: i.comboIncludes,
        dietary: i.dietary,
        needsReview: i.needsReview,
        reviewNote: i.reviewNote,
      })),
    })),
  };
  return JSON.stringify(clean, null, 2);
}
