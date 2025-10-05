import React from "react";
import { Crown } from "lucide-react";

export default function ProBadge({ className = "" }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 text-xs font-semibold ${className}`}>
      <Crown className="w-3 h-3" />
      PRO
    </span>
  );
}