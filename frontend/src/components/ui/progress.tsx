"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: string;
}

const sizeClasses = {
  sm: "h-1",
  md: "h-2",
  lg: "h-3",
};

export function Progress({ value = 0, max = 100, size = "md", color, className, ...props }: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-full bg-secondary", sizeClasses[size], className)}
      {...props}
    >
      <div
        className="h-full rounded-full transition-all duration-300 ease-in-out"
        style={{
          width: `${percentage}%`,
          backgroundColor: color || "hsl(var(--primary))",
        }}
      />
    </div>
  );
}
