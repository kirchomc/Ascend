import React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt, className, ...props }) {
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  return (
    <>
      {src && !error && (
        <img
          src={src}
          alt={alt}
          className={cn(
            "aspect-square h-full w-full object-cover transition-opacity",
            loaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          {...props}
        />
      )}
    </>
  );
}

export function AvatarFallback({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}