import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

import { createGeminiProvider } from "./ai-gateway.server";
import { normalizeCatalog, type MenuCatalog } from "./menu-types";

const InputSchema = z.object({
  images: z.array(z.string()).min(1).max(6),
});

const EXTRACTION_PROMPT = `You are an expert menu-digitization system for restaurants and cafes.
Look at the attached photo(s) of a paper menu — printed OR handwritten — and extract EVERY item into a structured catalog.

The menu may be handwritten, smudged, low-resolution, or partially cut off. Always attempt every
item you can see, including handwritten sections — never skip an item just because it's hard to
read. Do your best to read it, but never silently guess: whenever you are not confident about any
part of an item (illegible handwriting, ambiguous digits like 1/7 or 3/8, smudged or cut-off text,
overlapping words), still fill in your best-guess value AND flag that item for human review with a
specific reason. Confident, clearly-printed items should NOT be flagged.

Return ONLY valid minified JSON (no markdown, no code fences, no commentary) matching this shape:
{
  "restaurantName": string,        // best guess from the menu, else ""
  "currency": string,               // the ISO-4217-style code actually shown on the menu, read from its symbols/words/context (e.g. "₹"/"Rs."→"INR", "$"→"USD", "€"→"EUR", "£"→"GBP", "AED"→"AED"). Only use "INR" as a last-resort fallback if the menu gives no currency indication at all — never override a currency you can actually see.
  "categories": [
    {
      "name": string,              // e.g. "Starters", "Pizzas", "Drinks"
      "items": [
        {
          "name": string,
          "description": string,   // "" if none printed
          "price": number|null,    // base price as a plain number, no currency symbol. null if only variants have prices.
          "variants": [ { "name": string, "price": number|null } ],  // sizes/options e.g. Small/Medium/Large, Regular/Family
          "addons": [ { "name": string, "price": number|null } ],    // add-ons/extras/toppings, price is the surcharge
          "isCombo": boolean,      // true if it is a combo/meal/set that bundles multiple items
          "comboIncludes": [ string ],  // component items of the combo, else []
          "needsReview": boolean,  // true if ANY field on this item was uncertain — illegible handwriting, ambiguous price/digits, smudged or cut-off text. false if clearly legible.
          "reviewNote": string,    // required when needsReview is true: short specific reason, e.g. "Handwritten price illegible, guessed 250" or "Item name partially smudged". "" when needsReview is false.
          "dietary": "veg"|"nonveg"|null  // read the small vegetarian/non-vegetarian symbol printed next to the item (a green square/dot = veg, a brown/maroon/red square/triangle = non-veg — the standard Indian menu markers). "veg" or "nonveg" if that symbol is present, null if no such marker is printed next to the item.
        }
      ]
    }
  ]
}

Rules:
- Capture sizes as variants and extras/add-ons/toppings as addons. Do not invent items not on the menu.
- If a price shows multiple values for sizes, put them in variants and set price to null.
- Keep the menu's own category names and ordering. If none exist, group sensibly.
- Convert prices to numbers only (strip symbols). Use null when a price is genuinely absent.
- Fix obvious OCR typos in names but never fabricate descriptions.
- Never leave an item out of the catalog just because it's hard to read — extract your best guess and set needsReview: true instead.
- If a photo (or a section of one) is headed "Daily Special", "Today's Special", "Chef's Special", "Special of the Day", or similar, put ALL of its items into their own category — do not merge them into Starters/Mains/etc. Name that category after the menu's own wording (e.g. "Daily Specials", "Today's Specials"), even if similar-looking items already exist in other categories.
- Only set "dietary" when the menu actually prints a veg/non-veg marker next to that specific item — do not guess dietary status from the dish name alone.`;

function extractJson(text: string): unknown {
  let t = text.trim();
  // strip code fences if present
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    t = t.slice(start, end + 1);
  }
  return JSON.parse(t);
}

export const extractMenu = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<MenuCatalog> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI is not configured. Missing GEMINI_API_KEY.");

    const gemini = createGeminiProvider(apiKey);

    let text: string;
    try {
      const result = await generateText({
        model: gemini("gemini-2.5-flash"),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: EXTRACTION_PROMPT },
              ...data.images.map((image) => ({ type: "image" as const, image })),
            ],
          },
        ],
      });
      text = result.text;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status =
        (err as { statusCode?: number; status?: number })?.statusCode ??
        (err as { status?: number })?.status;
      if (status === 429 || /rate.?limit|429/i.test(message)) {
        throw new Error("RATE_LIMIT: Too many requests right now. Please wait a moment and try again.");
      }
      if (status === 402 || /payment|402|credit/i.test(message)) {
        throw new Error("NO_CREDITS: AI credits are exhausted. Add credits to keep scanning menus.");
      }
      throw new Error("The AI could not read this menu. Try a clearer, well-lit photo.");
    }

    try {
      return normalizeCatalog(extractJson(text));
    } catch {
      throw new Error("The menu was read but could not be structured. Try another photo.");
    }
  });
