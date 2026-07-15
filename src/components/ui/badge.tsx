type BadgeTone = "success" | "warning" | "danger" | "neutral";

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  neutral: "bg-neutral-100 text-neutral-600",
};

const dotClasses: Record<BadgeTone, string> = {
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  neutral: "bg-neutral-400",
};

const paymentStatusTone: Record<string, BadgeTone> = {
  PAGADO: "success",
  PENDIENTE: "warning",
  VENCIDO: "danger",
};

const enrollmentStatusTone: Record<string, BadgeTone> = {
  ACTIVA: "success",
  PAUSADA: "neutral",
  FINALIZADA: "neutral",
};

const statusLabel: Record<string, string> = {
  PAGADO: "Pagado",
  PENDIENTE: "Pendiente",
  VENCIDO: "Vencido",
  ACTIVA: "Activa",
  PAUSADA: "Pausada",
  FINALIZADA: "Finalizada",
};

export function Badge({ tone, children }: { tone: BadgeTone; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClasses[tone]}`} />
      {children}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return <Badge tone={paymentStatusTone[status] ?? "neutral"}>{statusLabel[status] ?? status}</Badge>;
}

export function EnrollmentStatusBadge({ status }: { status: string }) {
  return <Badge tone={enrollmentStatusTone[status] ?? "neutral"}>{statusLabel[status] ?? status}</Badge>;
}
