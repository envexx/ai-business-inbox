import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand text-on-brand hover:bg-brand-strong",
        primary: "bg-brand text-on-brand hover:bg-brand-strong",
        secondary: "bg-surface-2 text-ink hover:bg-line",
        outline: "border border-line-2 bg-surface text-ink hover:bg-surface-2",
        ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
        destructive: "bg-danger text-white hover:bg-danger/90",
        danger: "border border-danger/45 text-danger hover:bg-danger/10",
        link: "text-brand-strong underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5 text-sm",
        sm: "h-8 px-3 text-[13px]",
        md: "h-9 px-3.5 text-sm",
        lg: "h-10 px-5 text-sm",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
        "icon-xs": "h-6 w-6 [&_svg]:h-3 [&_svg]:w-3",
        "icon-lg": "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
