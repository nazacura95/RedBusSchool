"use client";

import { useState } from "react";
import { Trash2, Quote, MessageSquareOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Testimonial = { id: string; quote: string; author: string };

export function TestimonialsManager({ initialTestimonials }: { initialTestimonials: Testimonial[] }) {
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!quote.trim() || !author.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/testimonials", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quote, author }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("No se pudo guardar el testimonio.");
      return;
    }
    const testimonial = await res.json();
    setTestimonials((prev) => [...prev, testimonial]);
    setQuote("");
    setAuthor("");
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este testimonio?")) return;
    const res = await fetch("/api/testimonials", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
    } else {
      showToast("No se pudo eliminar el testimonio. Probá de nuevo.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-neutral-900">Testimonios</h3>
        <p className="text-sm text-neutral-500">
          Se muestran en la landing pública. Cargá solo citas reales de padres o alumnos —{" "}
          preguntales si podés compartir su comentario y con qué nombre.
        </p>
      </div>

      <Card>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[260px] flex-1 space-y-1.5">
            <Label htmlFor="quote">Cita textual</Label>
            <Input
              id="quote"
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              placeholder="Ej: Mi hija arrancó tímida y hoy pide hablar en inglés en casa."
            />
          </div>
          <div className="min-w-[200px] space-y-1.5">
            <Label htmlFor="author">Quién lo dijo</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Ej: Mamá de Sofía, Nivel 2"
            />
          </div>
          <Button type="submit" disabled={!quote.trim() || !author.trim() || saving}>
            {saving ? "Guardando…" : "Agregar"}
          </Button>
        </form>
        {error && <p role="alert" className="mt-2 text-sm text-danger-700">{error}</p>}
      </Card>

      {testimonials.length === 0 ? (
        <div className="flex items-center gap-4 rounded-lg border border-neutral-200 bg-white p-8">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-500">
            <MessageSquareOff className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Sin testimonios todavía</p>
            <p className="text-sm text-neutral-600">
              La landing no muestra la sección hasta que cargues al menos uno.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <Quote className="mt-0.5 h-4 w-4 shrink-0 text-primary-500" aria-hidden="true" />
                <div>
                  <p className="text-sm text-neutral-800">{t.quote}</p>
                  <p className="mt-1 text-xs text-neutral-500">{t.author}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(t.id)}
                aria-label={`Eliminar testimonio de ${t.author}`}
                className="shrink-0 text-neutral-400 hover:text-danger-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
