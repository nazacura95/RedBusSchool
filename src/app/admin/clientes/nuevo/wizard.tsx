"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import type { ReviewRow } from "@/lib/roster-import";

type Step = "org" | "brand" | "import" | "review" | "done";

type OrgResult = { organization: { id: string; name: string; slug: string }; owner: { email: string; password: string } };
type ConfirmResult = { imported: number; failed: { row: number; error?: string }[] };

const STEPS: { key: Step; label: string }[] = [
  { key: "org", label: "Instituto" },
  { key: "brand", label: "Marca" },
  { key: "import", label: "Alumnos" },
  { key: "review", label: "Revisión" },
  { key: "done", label: "Listo" },
];

function StepIndicator({ current }: { current: Step }) {
  const idx = STEPS.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
      {STEPS.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <span className={i <= idx ? "text-primary-500" : ""}>{s.label}</span>
          {i < STEPS.length - 1 && <span className="text-neutral-300">→</span>}
        </div>
      ))}
    </div>
  );
}

export function NewClientWizard() {
  const [step, setStep] = useState<Step>("org");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orgResult, setOrgResult] = useState<OrgResult | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [confirmResult, setConfirmResult] = useState<ConfirmResult | null>(null);

  async function handleCreateOrg(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          ownerName: form.get("ownerName"),
          ownerEmail: form.get("ownerEmail"),
        }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? "No se pudo crear el instituto");
      setOrgResult(body);
      setStep("brand");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBranding(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgResult) return;
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch(`/api/admin/organizations/${orgResult.organization.id}/branding`, { method: "POST", body: form });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? "No se pudo guardar la marca");
      setStep("import");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleImport(kind: "excel" | "document", e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!orgResult) return;
    setLoading(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch(`/api/admin/organizations/${orgResult.organization.id}/import/${kind}`, { method: "POST", body: form });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? "No se pudo leer el archivo");
      setRows(body.rows);
      setStep("review");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function updateRow(rowIndex: number, field: keyof ReviewRow, value: string) {
    setRows((prev) => prev.map((r) => (r.rowIndex === rowIndex ? { ...r, [field]: value } : r)));
  }

  function removeRow(rowIndex: number) {
    setRows((prev) => prev.filter((r) => r.rowIndex !== rowIndex));
  }

  async function handleConfirm() {
    if (!orgResult) return;
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/organizations/${orgResult.organization.id}/import/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error ?? "No se pudo guardar");
      setConfirmResult(body);
      setStep("done");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const hasErrors = rows.some((r) => r.errors.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900">
          <ArrowLeft className="h-4 w-4" /> Volver a clientes
        </Link>
        <StepIndicator current={step} />
      </div>

      {error && <div className="rounded-lg bg-danger-50 px-4 py-3 text-sm text-danger-700">{error}</div>}

      {step === "org" && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Datos del instituto</h2>
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre del instituto</Label>
              <Input id="name" name="name" required placeholder="Academia Ejemplo" />
            </div>
            <div>
              <Label htmlFor="ownerName">Nombre del director/a</Label>
              <Input id="ownerName" name="ownerName" required placeholder="María Pérez" />
            </div>
            <div>
              <Label htmlFor="ownerEmail">Email del director/a</Label>
              <Input id="ownerEmail" name="ownerEmail" type="email" required placeholder="maria@instituto.com" />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="mr-2" />}
              Crear instituto
            </Button>
          </form>
        </Card>
      )}

      {step === "brand" && orgResult && (
        <Card>
          <h2 className="mb-1 text-lg font-semibold text-neutral-900">Marca de {orgResult.organization.name}</h2>
          <p className="mb-4 text-sm text-neutral-500">Logo y color propio — se aplican al sidebar, dashboard y mensajes de WhatsApp de este instituto.</p>
          <form onSubmit={handleBranding} className="space-y-4">
            <div>
              <Label htmlFor="logo">Logo (opcional)</Label>
              <Input id="logo" name="logo" type="file" accept="image/*" />
            </div>
            <div>
              <Label htmlFor="primaryColorHex">Color principal</Label>
              <div className="flex items-center gap-3">
                <input type="color" name="primaryColorHexPicker" defaultValue="#c8102e" className="h-10 w-14 rounded border border-neutral-200" onChange={(e) => {
                  const hidden = document.getElementById("primaryColorHex") as HTMLInputElement | null;
                  if (hidden) hidden.value = e.target.value;
                }} />
                <Input id="primaryColorHex" name="primaryColorHex" defaultValue="#c8102e" className="max-w-[140px]" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading && <Spinner className="mr-2" />}
                Guardar marca
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("import")} disabled={loading}>
                Omitir por ahora
              </Button>
            </div>
          </form>
        </Card>
      )}

      {step === "import" && orgResult && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h2 className="mb-1 text-lg font-semibold text-neutral-900">Excel con plantilla</h2>
            <p className="mb-4 text-sm text-neutral-500">Columnas: Nombre, DNI, Teléfono, Email (opcional), Aula/Nivel. Carga determinística, sin IA.</p>
            <form onSubmit={(e) => handleImport("excel", e)} className="space-y-4">
              <Input name="file" type="file" accept=".xlsx,.xls,.csv" required />
              <Button type="submit" disabled={loading}>
                {loading && <Spinner className="mr-2" />}
                Leer Excel
              </Button>
            </form>
          </Card>
          <Card>
            <h2 className="mb-1 text-lg font-semibold text-neutral-900">Word o PDF sueltos</h2>
            <p className="mb-4 text-sm text-neutral-500">Extracción asistida por IA — vas a poder revisar y corregir cada dato antes de guardar nada.</p>
            <form onSubmit={(e) => handleImport("document", e)} className="space-y-4">
              <Input name="file" type="file" accept=".pdf,.docx" required />
              <Button type="submit" disabled={loading}>
                {loading && <Spinner className="mr-2" />}
                Leer documento
              </Button>
            </form>
          </Card>
          <div className="md:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setStep("done")}>
              Terminar sin cargar alumnos ahora
            </Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Revisión antes de guardar</h2>
              <p className="text-sm text-neutral-500">{rows.length} filas. Corregí lo que haga falta — nada se guarda todavía.</p>
            </div>
            <Button onClick={handleConfirm} disabled={loading || rows.length === 0}>
              {loading && <Spinner className="mr-2" />}
              Guardar {rows.length} alumnos
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2">DNI</th>
                  <th className="px-4 py-2">Teléfono</th>
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Aula/Nivel</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => (
                  <tr key={row.rowIndex} className={row.errors.length > 0 ? "bg-danger-50" : ""}>
                    {(["name", "dni", "phone", "email", "classroomName"] as const).map((field) => (
                      <td key={field} className="px-2 py-1.5">
                        <input
                          value={row[field] ?? ""}
                          onChange={(e) => updateRow(row.rowIndex, field, e.target.value)}
                          className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-sm hover:border-neutral-200 focus:border-primary-500 focus:outline-none"
                        />
                      </td>
                    ))}
                    <td className="px-4 py-1.5">
                      {row.errors.length > 0 ? (
                        <Badge tone="danger">{row.errors.join(" · ")}</Badge>
                      ) : (
                        <Badge tone="success">OK</Badge>
                      )}
                    </td>
                    <td className="px-4 py-1.5">
                      <button onClick={() => removeRow(row.rowIndex)} className="text-xs text-neutral-400 hover:text-danger-600">
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {hasErrors && (
            <p className="border-t border-neutral-100 px-6 py-3 text-xs text-warning-700">
              Hay filas marcadas con errores — se pueden guardar igual, pero conviene revisarlas primero (sobre todo las que vinieron de IA).
            </p>
          )}
        </Card>
      )}

      {step === "done" && (
        <Card className="text-center">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success-500" />
          <h2 className="text-lg font-semibold text-neutral-900">
            {orgResult ? `${orgResult.organization.name} está listo` : "Instituto creado"}
          </h2>
          {confirmResult && (
            <p className="mt-1 text-sm text-neutral-500">
              {confirmResult.imported} alumnos cargados
              {confirmResult.failed.length > 0 && `, ${confirmResult.failed.length} con error`}.
            </p>
          )}
          {orgResult && (
            <div className="mx-auto mt-4 max-w-sm rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-left text-sm">
              <p className="font-semibold text-neutral-900">Credenciales para pasarle al cliente:</p>
              <p className="mt-2 text-neutral-700">
                Email: <span className="font-mono">{orgResult.owner.email}</span>
              </p>
              <p className="text-neutral-700">
                Contraseña: <span className="font-mono">{orgResult.owner.password}</span>
              </p>
            </div>
          )}
          <Link href="/admin">
            <Button className="mt-6">Volver a clientes</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
