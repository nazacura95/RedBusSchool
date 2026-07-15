type Size = "sm" | "md" | "lg";

const sizeClasses: Record<Size, string> = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export function Avatar({ name, size = "md" }: { name: string; size?: Size }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary-500 font-semibold text-white ${sizeClasses[size]}`}
    >
      {initials(name)}
    </span>
  );
}
