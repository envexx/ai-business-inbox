"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/inbox", label: "Inbox" },
  { href: "/tasks", label: "Tasks" },
  { href: "/approvals", label: "Approvals" },
  { href: "/runs", label: "Automation runs" },
  { href: "/decisions", label: "AI decisions" },
  { href: "/analytics", label: "Analytics" },
  { href: "/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Wordmark() {
  return (
    <Link href="/" className="flex items-baseline gap-2">
      <span className="text-[15px] font-semibold tracking-tight text-ink">Switchboard</span>
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3">
        inbox ops
      </span>
    </Link>
  );
}

function NavLinks({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className={cn(
        orientation === "vertical"
          ? "flex flex-col gap-0.5"
          : "flex items-center gap-1 overflow-x-auto",
      )}
    >
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              orientation === "horizontal" && "whitespace-nowrap py-1.5",
              active
                ? "bg-surface-2 text-ink"
                : "text-ink-2 hover:bg-surface-2/70 hover:text-ink",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] md:grid md:grid-cols-[224px_1fr]">
      <aside className="sticky top-0 hidden h-[100dvh] flex-col justify-between border-r border-line bg-surface px-3 py-4 md:flex">
        <div className="flex flex-col gap-6">
          <div className="px-2">
            <Wordmark />
          </div>
          <NavLinks orientation="vertical" />
        </div>
        <div className="flex flex-col gap-3 px-2">
          <Link
            href="/intake"
            className="rounded-md bg-accent px-3 py-2 text-center text-sm font-medium text-on-accent transition-colors hover:bg-accent-strong"
          >
            New message
          </Link>
          <div className="flex items-center justify-between border-t border-line pt-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
              theme
            </span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <div className="flex min-h-[100dvh] min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Wordmark />
            <div className="flex items-center gap-2">
              <Link
                href="/intake"
                className="rounded-md bg-accent px-2.5 py-1.5 text-[13px] font-medium text-on-accent"
              >
                New message
              </Link>
              <ThemeToggle />
            </div>
          </div>
          <div className="border-t border-line px-2 py-1.5">
            <NavLinks orientation="horizontal" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
