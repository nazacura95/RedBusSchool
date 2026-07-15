"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

type SiteImage = { id: string; url: string; caption: string | null };

export function GalleryManager({ initialImages }: { initialImages: SiteImage[] }) {
  const [images, setImages] = useState(initialImages);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
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
    const res = await fetch("/api/gallery", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) setImages((prev) => prev.filter((img) => img.id !== id));
  }

  return (
    <div className="space-y-8">
      <Card>
        <h2 className="font-semibold text-neutral-900">Subir foto</h2>
        <form onSubmit={handleUpload} className="mt-4 flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="file">Imagen</Label>
            <input
              id="file"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block text-sm text-neutral-700"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="caption">Descripción (opcional)</Label>
            <Input
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ej: Clase de kids"
            />
          </div>
          <Button type="submit" disabled={!file || uploading}>
            {uploading ? "Subiendo..." : "Subir"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-danger-700">{error}</p>}
      </Card>

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
        {images.length === 0 && (
          <p className="col-span-full text-sm text-neutral-500">Todavía no hay fotos en la galería.</p>
        )}
      </div>
    </div>
  );
}
