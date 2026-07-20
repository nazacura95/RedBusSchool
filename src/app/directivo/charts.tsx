"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const tickStyle = { fontSize: 12, fontFamily: "var(--font-sans)", fill: "#6b6555" };
const tooltipContentStyle = {
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  borderRadius: 10,
  border: "1px solid #e4dcc8",
  boxShadow: "0 8px 20px -6px rgb(27 42 86 / 0.18)",
};
const tooltipLabelStyle = { fontFamily: "var(--font-serif)", fontWeight: 600, color: "#171717" };
const legendStyle = { fontFamily: "var(--font-sans)", fontSize: 13, color: "#4b4638" };

export function AlumnosPorNivelChart({ data }: { data: { level: string; alumnos: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4dcc8" />
        <XAxis dataKey="level" tick={tickStyle} />
        <YAxis allowDecimals={false} tick={tickStyle} />
        <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} cursor={{ fill: "#f5f3ee" }} />
        <Bar dataKey="alumnos" name="Alumnos" fill="#1B2A56" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PAGO_COLORS: Record<string, string> = {
  PAGADO: "#1B2A56",
  PENDIENTE: "#C98A2E",
  VENCIDO: "#C8102E",
};

const PAGO_LABELS: Record<string, string> = {
  PAGADO: "Pagado",
  PENDIENTE: "Pendiente",
  VENCIDO: "Vencido",
};

export function EstadoPagosChart({ data }: { data: { status: string; cantidad: number }[] }) {
  const labeled = data.map((d) => ({ ...d, label: PAGO_LABELS[d.status] ?? d.status }));
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
        <Legend wrapperStyle={legendStyle} formatter={(value) => PAGO_LABELS[value] ?? value} />
        <Pie
          data={labeled}
          dataKey="cantidad"
          nameKey="status"
          outerRadius={90}
          label={(entry) => (entry.payload as { label: string }).label}
        >
          {labeled.map((entry) => (
            <Cell key={entry.status} fill={PAGO_COLORS[entry.status] ?? "#a3a3a3"} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

const currencyFmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export function PagosHistoricoChart({
  data,
}: {
  data: { period: string; pagado: number; pendiente: number; vencido: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4dcc8" />
        <XAxis dataKey="period" tick={tickStyle} />
        <YAxis tick={tickStyle} tickFormatter={(v) => currencyFmt.format(v)} width={90} />
        <Tooltip
          contentStyle={tooltipContentStyle}
          labelStyle={tooltipLabelStyle}
          formatter={(value) => currencyFmt.format(Number(value))}
          cursor={{ fill: "#f5f3ee" }}
        />
        <Legend wrapperStyle={legendStyle} />
        <Bar dataKey="pagado" stackId="a" fill={PAGO_COLORS.PAGADO} name="Pagado" />
        <Bar dataKey="pendiente" stackId="a" fill={PAGO_COLORS.PENDIENTE} name="Pendiente" />
        <Bar dataKey="vencido" stackId="a" fill={PAGO_COLORS.VENCIDO} radius={[4, 4, 0, 0]} name="Vencido" />
      </BarChart>
    </ResponsiveContainer>
  );
}
