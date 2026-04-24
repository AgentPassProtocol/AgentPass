import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none font-mono text-sm font-medium uppercase tracking-wider transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary hover:bg-primary/80 hover:shadow-[0_0_24px_-4px_var(--color-primary)]",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/80",
        outline:
          "border border-terminal/40 bg-transparent text-terminal hover:border-terminal hover:bg-terminal/10 hover:shadow-[0_0_24px_-8px_var(--color-terminal)]",
        terminal:
          "border border-terminal bg-terminal/10 text-terminal hover:bg-terminal hover:text-background hover:shadow-[0_0_32px_-4px_var(--color-terminal)] before:content-['>_'] before:text-terminal",
        amber:
          "border border-amber bg-amber/10 text-amber hover:bg-amber hover:text-background hover:shadow-[0_0_32px_-4px_var(--color-amber)]",
        secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80",
        ghost: "hover:bg-accent/40 hover:text-accent-foreground",
        link: "text-terminal underline underline-offset-4 hover:text-amber",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
