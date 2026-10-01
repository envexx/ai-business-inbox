"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

export function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border border-line-2 transition-colors",
        "data-[state=checked]:border-accent data-[state=checked]:bg-accent data-[state=unchecked]:bg-surface-2",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block h-3.5 w-3.5 rounded-full bg-paper shadow-sm transition-transform",
          "translate-x-0.5 data-[state=checked]:translate-x-[1.15rem]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
