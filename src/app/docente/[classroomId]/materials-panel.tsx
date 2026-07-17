"use client";

import { useState } from "react";
import { Trash2, ExternalLink, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Material = { id: string; title: string; fileUrl: string; fileType: string };

export function MaterialsPanel({
  classroomId,
  initialMaterials,
}: {
  classroomId: string;
  initialMaterials: Material[];
}) {
  const [materials, setMaterials] = useState(initialMaterials);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.set("file", file);
    form.set("title", title.trim());

    const res = await fetch(`/api/classrooms/${classroomId}/materials`, { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      setError("No se pudo subir el material.");
      return;
    }
    const material = await res.json();
    setMaterials((prev) => [...prev, material]);
    setFile(null);
    setTitle("");
    (e.target as HTMLFormElement).reset();
  }

  async function handleDelete(materialId: string) {
    const res = await fetch(`/api/classrooms/${classroomId}/materials`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ materialId }),
    });
    if (res.ok) setMaterials((prev) => prev.filter((m) => m.id !== materialId));
  }

  return (
    <Card>
      <h3 className="font-semibold text-neutral-900">Materiales de estudio</h3>

      <form onSubmit={handleUpload} className="mt-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="material-title">Título</Label>
          <Input
            id="material-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Guía unidad 3"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="material-file">Archivo</Label>
          <input
            id="material-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block text-sm text-neutral-700"
          />
        </div>
        <Button type="submit" disabled={!file || !title.trim() || uploading}>
          {uploading ? "Subiendo..." : "Subir material"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-danger-700">{error}</p>}

      <div className="mt-6 space-y-2">
        {materials.length === 0 && (
          <div className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-8">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-500">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-neutral-900">Sin materiales</p>
              <p className="text-sm text-neutral-600">Todavía no subiste materiales.</p>
            </div>
          </div>
        )}
        {materials.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <span className="font-medium text-neutral-900">{m.title}</span>
              <Badge tone="neutral">{m.fileType}</Badge>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={m.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:underline"
              >
                Ver <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                onClick={() => handleDelete(m.id)}
                aria-label="Eliminar material"
                className="text-neutral-400 hover:text-danger-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
