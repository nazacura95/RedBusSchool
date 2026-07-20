"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const INTERESES = [
  "Kids (6-10 años)",
  "Teens (11-15)",
  "Adultos Principiantes",
  "Intermedio",
  "Avanzado / Conversación",
  "Todavía no sé, quiero que me asesoren",
];

const selectClass =
  "w-full rounded-md border-[1.5px] border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30";

export function LeadForm() {
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(false);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setSaving(false);
    if (res.ok) {
      setSent(true);
    } else {
      setError(true);
    }
  }

  if (sent) {
    return (
      <Card className="rounded-[18px] border-accent-500 text-center">
        <p className="font-serif text-lg font-semibold text-accent-500">¡Gracias! ✓</p>
        <p className="mt-1 text-sm text-neutral-700">Te vamos a contactar a la brevedad.</p>
      </Card>
    );
  }

  return (
    <Card className="rounded-[18px]">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="lead-name">Nombre</Label>
            <Input id="lead-name" name="name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lead-phone">Teléfono</Label>
            <Input id="lead-phone" name="phone" type="tel" required />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lead-email">Email</Label>
          <Input id="lead-email" name="email" type="email" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lead-interest">¿En qué estás interesado?</Label>
          <select id="lead-interest" name="interest" required className={selectClass} defaultValue="">
            <option value="" disabled>
              Elegí una opción
            </option>
            {INTERESES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lead-message">Mensaje</Label>
          <textarea
            id="lead-message"
            name="message"
            rows={3}
            placeholder="Contanos algo más si querés"
            className={selectClass}
          />
        </div>
        {error && <p className="text-sm text-primary-500">Algo salió mal, probá de nuevo.</p>}
        <Button type="submit" variant="primary" className="w-full">
          {saving && <Spinner className="mr-2" />}
          {saving ? "Enviando…" : "Enviar"}
        </Button>
      </form>
    </Card>
  );
}
