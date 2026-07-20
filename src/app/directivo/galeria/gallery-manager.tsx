"use client";

import { useState } from "react";
import { Trash2, ImagePlus, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

type SiteImage = { id: string; url: string; caption: string | null };

export function GalleryManager({ initialImages }: { initialImages: SiteImage[] }) {
  const [images, setImages] = useState(initialImages);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (uploading || !file) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    if (caption) form.set("caption", caption);

    const res = await fetch("/api/gallery", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      setError("No se pudo subir la imagen.");
      return;
    }
    const image = await res.json();
    setImages((prev) => [...prev, image]);
    setFile(null);
    setCaption("");
    (e.target as HTMLFormElement).reset();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta foto de la galería?")) return;
    const res = await fetch("/api/gallery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setImages((prev) => prev.filter((img) => img.id !== id));
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleUpload}
        className="flex flex-wrap items-center gap-5 rounded-lg border-2 border-dashed border-neutral-300 bg-white p-7"
      >
        <label htmlFor="file" className="flex min-w-[260px] flex-1 cursor-pointer items-center gap-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-500">
            <ImagePlus className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-neutral-900">
              {file ? file.name : "Subir foto"}
            </span>
            <span className="block text-sm text-neutral-600">
              Arrastrá una imagen o hacé clic para elegir un archivo. JPG o PNG.
            </span>
          </span>
        </label>
        <input
          id="file"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
        <div className="space-y-1.5">
          <Label htmlFor="caption">Descripción (opcional)</Label>
          <Input
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Ej: Clase de kids"
          />
        </div>
        <Button type="submit" variant="primary" disabled={!file}>
          {uploading && <Spinner className="mr-2" />}
          {uploading ? "Subiendo…" : "Subir"}
        </Button>
      </form>
      {error && <p role="alert" className="text-sm text-danger-700">{error}</p>}

      {images.length === 0 ? (
        <div className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-500">
            <ImageOff className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Todavía no hay fotos</p>
            <p className="text-sm text-neutral-600">Todavía no hay fotos en la galería.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg border border-neutral-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.caption ?? ""} className="h-40 w-full object-cover" />
              <button
                onClick={() => handleDelete(img.id)}
                aria-label="Eliminar"
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-danger-700 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              {img.caption && (
                <p className="truncate bg-white px-2 py-1 text-xs text-neutral-600">{img.caption}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
