import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-qf-border-primary bg-qf-bg-secondary px-3 py-2 text-base text-white transition-all placeholder:text-qf-text-muted focus-visible:outline-none focus-visible:border-qf-border-accent focus-visible:ring-1 focus-visible:ring-qf-border-accent/40 disabled:cursor-not-allowed disabled:opacity-50 file:border-0 file:bg-transparent file:text-sm file:font-medium md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
