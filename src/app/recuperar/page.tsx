"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input, Label } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

export default function RecuperarPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", dni: "", phone: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/auth/activar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setError(data?.error ?? "No se pudo guardar la contraseña.");
      return;
    }
    router.push("/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/brand/logo-256.png" alt="Redbus School" width={44} height={44} className="h-11 w-11 rounded-full" />
          <span className="font-serif text-[19px] font-bold text-neutral-800">
            Redbus <span className="text-primary-500">School</span>
          </span>
        </Link>
        <LinkButton href="/login" variant="secondary">
          ← Volver a ingresar
        </LinkButton>
      </header>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm rounded-[20px] bg-white p-8 shadow-lg">
          <h2 className="text-center text-xl font-semibold text-neutral-800">Activar cuenta / recuperar acceso</h2>
          <p className="mt-1 text-center text-sm text-neutral-500">
            Ingresá los datos con los que te dieron de alta en el instituto y elegí tu contraseña.
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dni">DNI</Label>
              <Input id="dni" required value={form.dni} onChange={(e) => set("dni", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                required
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="11 2233 4455"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Nueva contraseña</Label>
              <PasswordInput
                id="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
              />
            </div>
            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={saving}>
              {saving ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
