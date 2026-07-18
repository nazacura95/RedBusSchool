import { LucideIcon } from "lucide-react";
import { Card } from "./card";

type Tone = "primary" | "accent" | "info" | "warning" | "success" | "danger";

const toneClasses: Record<Tone, string> = {
  primary: "bg-primary-50 text-primary-500",
  accent: "bg-accent-50 text-accent-500",
  info: "bg-gold-50 text-gold-500",
  warning: "bg-warning-50 text-warning-700",
  success: "bg-success-50 text-success-700",
  danger: "bg-danger-50 text-danger-700",
};

export function StatTile({
  label,
  value,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <Card className="flex items-center gap-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${toneClasses[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-neutral-600">{label}</p>
        <p className="truncate text-2xl font-bold text-neutral-900 [font-variant-numeric:tabular-nums]" title={String(value)}>
          {value}
        </p>
      </div>
    </Card>
  );
}
