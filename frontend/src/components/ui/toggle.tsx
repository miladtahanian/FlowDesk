"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToggleProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
  size?: "sm" | "md" | "lg";
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, pressed, onPressedChange, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-7 px-1.5",
      md: "h-9 px-2",
      lg: "h-10 px-3",
    };

    return (
      <button
        ref={ref}
        type="button"
        aria-pressed={pressed}
        onClick={() => onPressedChange?.(!pressed)}
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          sizeClasses[size],
          pressed ? "bg-accent text-accent-foreground" : "bg-transparent",
          className
        )}
        {...props}
      />
    );
  }
);
Toggle.displayName = "Toggle";

export { Toggle };
