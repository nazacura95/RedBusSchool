"use client";

import { useEffect, useState } from "react";
import { Wallet, Clock, AlertTriangle, PiggyBank } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Table, Thead, Tbody, Tr, Th, Td } from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Spinner } from "@/components/ui/spinner";
import { TableRowsSkeleton } from "@/components/ui/skeleton";
import { PagosHistoricoChart } from "../charts";

const currency = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const selectClass =
  "w-full rounded-md border-[1.5px] border-neutral-200 px-3.5 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30";

type Student = { id: string; name: string };
type MonthTotals = { period: string; pagado: number; pendiente: number; vencido: number };
type Payment = {
  id: string;
  period: string;
  amount: string;
  status: string;
  method: string | null;
  dueDate: string | null;
  paidAt: string | null;
  student: { id: string; user: { name: string } };
};

export function PagosView({
  students,
  currentPeriod,
  currentMonth,
  historicoPagado,
  trend,
}: {
  students: Student[];
  currentPeriod: string;
  currentMonth: MonthTotals;
  historicoPagado: number;
  trend: MonthTotals[];
}) {
  const [period, setPeriod] = useState(currentPeriod);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const { showToast } = useToast();

  function refresh() {
    fetch(`/api/payments?period=${period}`)
      .then((res) => res.json())
      .then((data) => setPayments(data))
      .finally(() => setLoading(false));
  }

  useEffect(refresh, [period]);

  function handlePeriodChange(value: string) {
    setLoading(true);
    setPeriod(value);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900">Pagos</h2>
          <p className="text-sm text-neutral-500">Cuotas de alumnos, mes en curso e histórico.</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(true)}>
          + Registrar pago
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label={`Cobrado en ${currentPeriod}`} value={currency.format(currentMonth.pagado)} icon={Wallet} tone="success" />
        <StatTile label={`Pendiente en ${currentPeriod}`} value={currency.format(currentMonth.pendiente)} icon={Clock} tone="warning" />
        <StatTile label={`Vencido en ${currentPeriod}`} value={currency.format(currentMonth.vencido)} icon={AlertTriangle} tone="danger" />
        <StatTile label="Cobrado histórico" value={currency.format(historicoPagado)} icon={PiggyBank} tone="accent" />
      </div>

      <Card>
        <h3 className="font-semibold text-neutral-900">Últimos 6 meses</h3>
        <PagosHistoricoChart data={trend} />
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-neutral-900">Cuotas del período</h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="period-filter">Período</Label>
            <Input
              id="period-filter"
              type="month"
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        <Table>
          <Thead>
            <Tr>
              <Th>Alumno</Th>
              <Th>Monto</Th>
              <Th>Estado</Th>
              <Th>Método</Th>
              <Th>Vence</Th>
            </Tr>
          </Thead>
          <Tbody>
            {loading && <TableRowsSkeleton rows={5} cols={5} />}
            {!loading && payments.map((p) => (
              <Tr key={p.id}>
                <Td className="font-medium text-neutral-900">{p.student.user.name}</Td>
                <Td className="tabular-nums">{currency.format(Number(p.amount))}</Td>
                <Td>
                  <PaymentStatusBadge status={p.status} />
                </Td>
                <Td>{p.method ?? "—"}</Td>
                <Td>{p.dueDate ? new Date(p.dueDate).toLocaleDateString("es-AR") : "—"}</Td>
              </Tr>
            ))}
            {!loading && payments.length === 0 && (
              <Tr>
                <Td colSpan={5} className="text-center text-neutral-500">
                  Sin pagos registrados en {period}.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </Card>

      {showForm && (
        <NewPaymentForm
          students={students}
          defaultPeriod={period}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            refresh();
            showToast("Pago registrado.", "success");
          }}
        />
      )}
    </div>
  );
}

function NewPaymentForm({
  students,
  defaultPeriod,
  onClose,
  onCreated,
}: {
  students: Student[];
  defaultPeriod: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [period, setPeriod] = useState(defaultPeriod);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Efectivo");
  const [paid, setPaid] = useState(true);
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !studentId || !period || !amount) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, period, amount, method, paid, dueDate: dueDate || null }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("No se pudo registrar el pago.");
      showToast("No se pudo registrar el pago.");
      return;
    }
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-neutral-900/40 px-4">
      <Card role="dialog" aria-modal="true" aria-labelledby="new-payment-title" className="w-full max-w-md">
        <h3 id="new-payment-title" className="mb-4 font-semibold text-neutral-900">Registrar pago</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="student">Alumno</Label>
            <select id="student" value={studentId} onChange={(e) => setStudentId(e.target.value)} className={selectClass} required>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="period">Período</Label>
              <Input id="period" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} required />
            </div>
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="amount">Monto</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ej: 15000 (o el saldo de una cuota parcial)"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="method">Método</Label>
            <select id="method" value={method} onChange={(e) => setMethod(e.target.value)} className={selectClass}>
              {["Efectivo", "Transferencia", "Mercado Pago", "Otro"].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
            Marcar como pagado
          </label>
          {!paid && (
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Vence (opcional)</Label>
              <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              <p className="text-xs text-neutral-500">
                Para saldos parciales: registrá lo que paga hoy como un pago aparte, y el resto acá con su
                vencimiento.
              </p>
            </div>
          )}
          {error && <p role="alert" className="text-sm text-danger-700">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              {saving && <Spinner className="mr-2" />}
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
