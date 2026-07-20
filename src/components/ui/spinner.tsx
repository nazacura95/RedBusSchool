export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-hidden="true"
      className={`inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent opacity-70 ${className}`}
    />
  );
}
