import { AnchorHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "white";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary-500 text-white hover:bg-primary-600",
  secondary: "bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50",
  white: "bg-white text-primary-600 hover:bg-primary-50",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant; size?: Size }) {
  return (
    <a
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
