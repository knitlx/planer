import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-qf-border-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#FFC300] text-[#0A0908] border border-[#FFC300] hover:brightness-105",
        destructive:
          "bg-[#ff5f33] text-[#0A0908] hover:brightness-110 border border-[#ff5f33]/40",
        outline:
          "border border-qf-border-primary bg-qf-bg-secondary text-qf-text-primary hover:border-qf-border-accent hover:bg-qf-bg-tertiary",
        secondary:
          "border border-qf-border-secondary bg-qf-bg-secondary text-qf-text-primary hover:border-qf-border-accent hover:bg-qf-bg-tertiary",
        ghost: "text-qf-text-secondary hover:text-qf-text-primary hover:bg-white/5",
        link: "text-qf-text-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
