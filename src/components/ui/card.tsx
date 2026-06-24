import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const variants = {
  glass: "glass rounded-2xl p-6",
  "glass-dark": "glass-dark rounded-2xl p-6",
  solid: "bg-[var(--color-dark-mid)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6",
  land: "rounded-2xl p-6 border",
};

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variants;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "solid", className, ...props }, ref) => (
    <div ref={ref} className={cn(variants[variant], className)} {...props} />
  )
);
Card.displayName = "Card";
export default Card;
