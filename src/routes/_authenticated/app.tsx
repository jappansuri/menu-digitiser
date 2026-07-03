import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChefHat, LogOut, Loader2, Sparkles, Store } from "lucide-react";

import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MenuUploader, type UploadImage } from "@/components/menu/MenuUploader";
import { CatalogEditor } from "@/components/menu/CatalogEditor";
import { extractMenu } from "@/lib/menu.functions";
import { getProfile, updateRestaurantName } from "@/lib/profile.functions";
import { countItems, type MenuCatalog } from "@/lib/menu-types";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [{ title: "Scan menu — CBrew" }],
  }),
  component: AppPage,
});

function AppPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<UploadImage[]>([]);
  const [catalog, setCatalog] = useState<MenuCatalog | null>(null);
  const [loading, setLoading] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);

  const runExtract = useServerFn(extractMenu);
  const runGetProfile = useServerFn(getProfile);
  const runUpdateName = useServerFn(updateRestaurantName);

  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: () => runGetProfile(),
  });

  const restaurantName = profileQuery.data?.restaurant_name?.trim() ?? "";
  const needsName = profileQuery.isSuccess && restaurantName.length === 0;

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nameDraft.trim().length === 0) {
      toast.error("Please enter your restaurant name.");
      return;
    }
    setSavingName(true);
    try {
      await runUpdateName({ data: { restaurantName: nameDraft.trim() } });
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Restaurant name saved");
    } catch {
      toast.error("Could not save restaurant name. Try again.");
    } finally {
      setSavingName(false);
    }
  };

  const handleScan = async () => {
    if (images.length === 0) return;
    setLoading(true);
    try {
      const result = await runExtract({ data: { images: images.map((i) => i.dataUrl) } });
      if (countItems(result) === 0) {
        toast.error("No menu items found. Try a clearer, closer photo.");
      } else {
        setCatalog({ ...result, restaurantName: restaurantName || result.restaurantName });
        toast.success(
          `Found ${countItems(result)} items across ${result.categories.length} categories`,
        );
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Something went wrong.";
      const clean = raw.replace(/^(RATE_LIMIT|NO_CREDITS):\s*/, "");
      toast.error(clean);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCatalog(null);
    setImages([]);
  };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-center" richColors />

      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground [background-image:var(--gradient-warm)] shadow-[var(--shadow-soft)]">
              <ChefHat className="h-5 w-5" />
            </div>
            <div className="leading-none">
              <span className="font-display text-xl font-semibold tracking-tight">CBrew</span>
              {restaurantName && (
                <span className="ml-2 hidden items-center gap-1 text-sm text-muted-foreground sm:inline-flex">
                  <Store className="h-3.5 w-3.5" /> {restaurantName}
                </span>
              )}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        {profileQuery.isLoading ? (
          <div className="flex items-center justify-center py-32 text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading your workspace…
          </div>
        ) : needsName ? (
          <section className="mx-auto max-w-md py-16">
            <div className="rounded-2xl border bg-card p-6 shadow-[var(--shadow-lift)] sm:p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/50 text-primary">
                <Store className="h-6 w-6" />
              </div>
              <h1 className="font-display text-2xl font-semibold">
                What's your restaurant called?
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll attach it to every catalog you create. You can change it later.
              </p>
              <form onSubmit={handleSaveName} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="restaurant-name">Restaurant name</Label>
                  <Input
                    id="restaurant-name"
                    placeholder="e.g. Bella's Trattoria"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    maxLength={120}
                    autoFocus
                  />
                </div>
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  disabled={savingName}
                  className="w-full"
                >
                  {savingName ? (
                    <>
                      <Loader2 className="animate-spin" /> Saving…
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>
            </div>
          </section>
        ) : catalog ? (
          <section className="py-8">
            <CatalogEditor catalog={catalog} onChange={setCatalog} onReset={handleReset} />
          </section>
        ) : (
          <section className="py-10">
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/40 px-3 py-1 text-xs font-medium text-accent-foreground">
                <Sparkles className="h-3.5 w-3.5" /> Ready to scan
              </span>
              <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Upload {restaurantName ? `${restaurantName}'s` : "your"} menu
              </h1>
              <p className="mt-2 text-muted-foreground">
                Add photos of your paper menu and we'll turn them into a structured catalog.
              </p>
            </div>
            <div className="mx-auto mt-8 max-w-2xl">
              <MenuUploader
                images={images}
                onChange={setImages}
                onScan={handleScan}
                loading={loading}
              />
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
