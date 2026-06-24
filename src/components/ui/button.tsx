import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const variants = {
  coral: "bg-[var(--color-sphere-coral)] hover:bg-[var(--color-sphere-coral-dark)] text-white",
  gold: "bg-[var(--color-sphere-gold)] hover:bg-[var(--color-sphere-gold-dark)] text-[var(--color-dark)]",
  ghost: "border border-[var(--color-sphere-coral)] text-[var(--color-sphere-coral)] hover:bg-[var(--color-sphere-coral)] hover:text-white",
  dark: "bg-[var(--color-dark-mid)] text-white border border-[rgba(255,255,255,0.1)] hover:border-[var(--color-sphere-coral)]",
  "ws-blue": "bg-[var(--color-ws-blue)] hover:bg-[var(--color-ws-blue-dark)] text-white",
  "ws-green": "bg-[var(--color-ws-green)] hover:bg-[var(--color-ws-green-dark)] text-white",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-base rounded-xl",
  lg: "px-8 py-4 text-lg rounded-2xl font-bold",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "coral", size = "md", className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
export default Button;
