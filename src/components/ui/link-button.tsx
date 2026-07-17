import { AnchorHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "white";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary-500 text-white hover:bg-primary-600 shadow-[0_10px_24px_-8px_rgba(200,16,46,0.5)]",
  secondary: "bg-transparent border-[1.5px] border-accent-500 text-accent-500 hover:bg-accent-500 hover:text-white",
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
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
