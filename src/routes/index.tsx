import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ChefHat, Layers, ListChecks, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import heroImage from "@/assets/hero-menu.jpg";

// Inherits title/description/og from __root.tsx; ships no og:image so hosting
// injects the project's social preview at serve time.
export const Route = createFileRoute("/")({
  component: Index,
});

const STEPS = [
  {
    icon: Camera,
    title: "Snap the menu",
    body: "Upload photos of any paper or printed menu — even multi-page ones.",
  },
  {
    icon: Sparkles,
    title: "AI reads it",
    body: "Items, prices, sizes, add-ons and combos are detected automatically.",
  },
  {
    icon: ListChecks,
    title: "Review & tidy",
    body: "Edit anything inline. Fix a price, rename an item, adjust a variant.",
  },
  {
    icon: Layers,
    title: "Export & import",
    body: "Download a clean CSV or JSON catalog, ready for your POS or store.",
  },
];

function Index() {
  const { user, loading } = useAuth();
  const ctaTo = user ? "/app" : "/auth";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground [background-image:var(--gradient-warm)] shadow-[var(--shadow-soft)]">
              <ChefHat className="h-5 w-5" />
            </div>
            <div className="leading-none">
              <span className="font-display text-xl font-semibold tracking-tight">CBrew</span>
              <span className="ml-2 hidden text-sm text-muted-foreground sm:inline">
                menu → catalog
              </span>
            </div>
          </div>
          {!loading &&
            (user ? (
              <Button asChild size="sm" variant="hero">
                <Link to="/app">Open app</Link>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button asChild size="sm" variant="ghost">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild size="sm" variant="hero">
                  <Link to="/auth">Get started</Link>
                </Button>
              </div>
            ))}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24">
        {/* Hero */}
        <section className="grid items-center gap-8 py-10 md:grid-cols-2 md:py-16">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <Camera className="h-3.5 w-3.5" /> Menu digitizer
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Turn a photo of your menu into an{" "}
              <span className="text-gradient-warm">import-ready catalog</span>
            </h1>
            <p className="mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
              CBrew reads paper menus and builds a clean, structured catalog — capturing sizes,
              add-ons and combos — that you can edit and export in seconds.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button asChild variant="hero" size="xl">
                <Link to={ctaTo}>
                  <Camera /> {user ? "Scan a menu" : "Get started free"}
                </Link>
              </Button>
              {!user && (
                <Button asChild variant="outline" size="xl">
                  <Link to="/auth">Sign in</Link>
                </Button>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-primary" /> Variants & combos
              </span>
              <span className="flex items-center gap-1.5">
                <ListChecks className="h-4 w-4 text-primary" /> Fully editable
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-primary" /> CSV & JSON export
              </span>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border shadow-[var(--shadow-lift)]">
              <img
                src={heroImage}
                alt="Paper restaurant menu on a wooden table surrounded by fresh ingredients"
                width={1536}
                height={1024}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 hidden rotate-[-4deg] rounded-2xl border bg-card px-4 py-3 shadow-[var(--shadow-lift)] sm:block">
              <p className="font-display text-sm font-semibold">Margherita Pizza</p>
              <p className="text-xs text-muted-foreground">S · M · L + toppings</p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-14">
          <h2 className="text-center font-display text-2xl font-semibold">How CBrew works</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="rounded-2xl border bg-card p-5 shadow-[var(--shadow-soft)]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/50 text-primary">
                  <step.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-xs font-semibold text-muted-foreground">Step {i + 1}</p>
                <h3 className="mt-1 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="hero" size="xl">
              <Link to={ctaTo}>{user ? "Scan a menu" : "Start digitizing your menu"}</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-5xl px-4 text-center text-sm text-muted-foreground">
          CBrew — snap your menu, get a catalog.
        </div>
      </footer>
    </div>
  );
}
