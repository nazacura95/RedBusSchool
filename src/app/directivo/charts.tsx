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
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export function AlumnosPorNivelChart({ data }: { data: { level: string; alumnos: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4dcc8" />
        <XAxis dataKey="level" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="alumnos" fill="#1B2A56" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const PAGO_COLORS: Record<string, string> = {
  PAGADO: "#1B2A56",
  PENDIENTE: "#C98A2E",
  VENCIDO: "#C8102E",
};

export function EstadoPagosChart({ data }: { data: { status: string; cantidad: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Tooltip />
        <Pie data={data} dataKey="cantidad" nameKey="status" outerRadius={90} label>
          {data.map((entry) => (
            <Cell key={entry.status} fill={PAGO_COLORS[entry.status] ?? "#a3a3a3"} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
