"use client";

import { useEffect, useState } from "react";
import { Receipt, PiggyBank, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const selectClass =
  "w-full rounded-md border-[1.5px] border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30";

const CATEGORIES = [
  "Alquiler",
  "Luz",
  "Gas",
  "Agua",
  "Wifi/Internet",
  "Mobiliario (mesas, sillas)",
  "Regalos y eventos",
  "Decoración",
  "Insumos de limpieza",
  "Otro",
];

type Expense = { id: string; category: string; description: string | null; amount: string; date: string };
type CategoryTotal = { category: string; amount: number };

function todayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function GastosView({
  currentPeriod,
  totalMes,
  historicoTotal,
  categoryBreakdown,
}: {
  currentPeriod: string;
  totalMes: number;
  historicoTotal: number;
  categoryBreakdown: CategoryTotal[];
}) {
  const [period, setPeriod] = useState(currentPeriod);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useToast();

  function load() {
    fetch(`/api/expenses?period=${period}`)
      .then((res) => res.json())
      .then(setExpenses);
  }

  useEffect(load, [period]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    if (res.ok) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } else {
      showToast("No se pudo eliminar el gasto. Probá de nuevo.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Gastos</h2>
          <p className="text-sm text-neutral-500">Alquiler, servicios, insumos y eventos del instituto.</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          + Registrar gasto
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatTile label={`Gastado en ${currentPeriod}`} value={currency.format(totalMes)} icon={Receipt} tone="danger" />
        <StatTile label="Gastado histórico" value={currency.format(historicoTotal)} icon={PiggyBank} tone="accent" />
      </div>

      {categoryBreakdown.length > 0 && (
        <Card>
          <h3 className="mb-3 font-semibold text-neutral-900">Por categoría ({currentPeriod})</h3>
          <ul className="space-y-2">
            {categoryBreakdown.map((c) => (
              <li key={c.category} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">{c.category}</span>
                <span className="font-medium text-neutral-900">{currency.format(c.amount)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-neutral-900">Detalle del período</h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="period-filter">Período</Label>
            <Input
              id="period-filter"
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        <Table>
          <Thead>
            <Tr>
              <Th>Fecha</Th>
              <Th>Categoría</Th>
              <Th>Descripción</Th>
              <Th>Monto</Th>
              <Th />
            </Tr>
          </Thead>
          <Tbody>
            {expenses.map((e) => (
              <Tr key={e.id}>
                <Td>{new Date(e.date).toLocaleDateString("es-AR", { timeZone: "UTC" })}</Td>
                <Td className="font-medium text-neutral-900">{e.category}</Td>
                <Td>{e.description ?? "—"}</Td>
                <Td>{currency.format(Number(e.amount))}</Td>
                <Td>
                  <button
                    onClick={() => handleDelete(e.id)}
                    aria-label={`Eliminar gasto de ${e.category}`}
                    className="text-neutral-400 hover:text-danger-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Td>
              </Tr>
            ))}
            {expenses.length === 0 && (
              <Tr>
                <Td colSpan={5} className="text-center text-neutral-500">
                  Sin gastos registrados en {period}.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Card>

      {showForm && (
        <NewExpenseForm
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            load();
            showToast("Gasto registrado.", "success");
          }}
        />
      )}
    </div>
  );
}

function NewExpenseForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayLocal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category || !amount || !date) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, description, amount, date }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("No se pudo registrar el gasto.");
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-900/40 px-4">
      <Card role="dialog" aria-modal="true" aria-labelledby="new-expense-title" className="w-full max-w-md">
        <h3 id="new-expense-title" className="mb-4 font-semibold text-neutral-900">Registrar gasto</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">Categoría</Label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: factura de julio"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="date">Fecha</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </div>
          </div>
          {error && <p role="alert" className="text-sm text-danger-700">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
