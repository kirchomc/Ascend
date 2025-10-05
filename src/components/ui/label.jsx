import React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, children, ...props }) {
  return (
    <label
      className={cn(
        "text-sm font-medium text-gray-900 dark:text-white",
        className
      )}
      {...props}
    >
      {children}
    </label>
  );
}