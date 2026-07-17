"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/drawer";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FormState = {
  name: string;
  email: string;
  dni: string;
  phone: string;
  address: string;
  birthDate: string;
};

const EMPTY_FORM: FormState = { name: "", email: "", dni: "", phone: "", address: "", birthDate: "" };

export function NewStudentForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "No se pudo crear el alumno.");
      return;
    }
    onCreated();
  }

  return (
    <Drawer open onClose={onClose} title="Nuevo alumno">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="off"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dni">DNI</Label>
          <Input id="dni" value={form.dni} onChange={(e) => set("dni", e.target.value)} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            required
            placeholder="11 2233 4455"
          />
          <p className="text-xs text-neutral-500">
            Con email, DNI y teléfono va a poder activar su cuenta una vez que la habilites desde su legajo.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Dirección</Label>
          <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="birthDate">Fecha de nacimiento</Label>
          <Input id="birthDate" type="date" value={form.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
        </div>
        {error && <p className="text-sm text-danger-700">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Creando..." : "Crear alumno"}
          </Button>
        </div>
      </form>
    </Drawer>
  );
}
