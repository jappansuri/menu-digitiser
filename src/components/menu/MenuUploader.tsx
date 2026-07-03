import { useCallback, useRef, useState } from "react";
import { ImagePlus, Loader2, ScanText, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface UploadImage {
  id: string;
  name: string;
  dataUrl: string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

interface MenuUploaderProps {
  images: UploadImage[];
  onChange: (images: UploadImage[]) => void;
  onScan: () => void;
  loading: boolean;
}

export function MenuUploader({ images, onChange, onScan, loading }: MenuUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      const next: UploadImage[] = [];
      for (const file of list.slice(0, 6)) {
        const dataUrl = await fileToDataUrl(file);
        next.push({ id: `${file.name}-${Date.now()}-${Math.random()}`, name: file.name, dataUrl });
      }
      onChange([...images, ...next].slice(0, 6));
    },
    [images, onChange],
  );

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-card/70 px-6 py-12 text-center transition-colors",
          dragging ? "border-primary bg-accent/30" : "border-border hover:border-primary/60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/50 text-primary shadow-[var(--shadow-soft)]">
          <ImagePlus className="h-8 w-8" />
        </div>
        <p className="font-display text-xl font-semibold text-foreground">
          Drop a menu photo here
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Or click to browse. Add up to 6 photos of a single menu — JPG or PNG work best.
        </p>
      </div>

      {images.length > 0 && (
        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl border bg-muted shadow-[var(--shadow-soft)]"
            >
              <img
                src={img.dataUrl}
                alt={img.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                aria-label="Remove image"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(images.filter((i) => i.id !== img.id));
                }}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow transition hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button
          variant="hero"
          size="xl"
          disabled={images.length === 0 || loading}
          onClick={onScan}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" /> Reading your menu…
            </>
          ) : (
            <>
              <ScanText /> Scan {images.length > 1 ? `${images.length} photos` : "menu"}
            </>
          )}
        </Button>
        {images.length === 0 && (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-accent" /> Powered by AI menu recognition
          </p>
        )}
      </div>
    </div>
  );
}
