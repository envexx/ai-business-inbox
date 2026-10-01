"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChartIcon,
  CheckCircledIcon,
  CheckboxIcon,
  DashboardIcon,
  EnvelopeClosedIcon,
  GearIcon,
  ListBulletIcon,
  PlusIcon,
  ReaderIcon,
} from "@radix-ui/react-icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "./theme-toggle";

const QUEUE_NAV = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/inbox", label: "Inbox", icon: EnvelopeClosedIcon },
  { href: "/tasks", label: "Tasks", icon: CheckboxIcon },
  { href: "/approvals", label: "Approvals", icon: CheckCircledIcon },
];

const INSIGHT_NAV = [
  { href: "/runs", label: "Automation runs", icon: ListBulletIcon },
  { href: "/decisions", label: "AI decisions", icon: ReaderIcon },
  { href: "/analytics", label: "Analytics", icon: BarChartIcon },
  { href: "/settings", label: "Settings", icon: GearIcon },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const isActive = useIsActive();
  const all = [...QUEUE_NAV, ...INSIGHT_NAV];
  const current = all.find((item) => isActive(item.href))?.label ?? "Dashboard";

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild size="lg" className="gap-2.5">
                  <Link href="/">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand text-[13px] font-semibold text-on-brand">
                      S
                    </span>
                    <span className="flex min-w-0 flex-col leading-tight">
                      <span className="truncate text-sm font-semibold text-ink">Switchboard</span>
                      <span className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
                        inbox ops
                      </span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Queue</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {QUEUE_NAV.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.href)}
                          tooltip={item.label}
                        >
                          <Link href={item.href}>
                            <Icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Insight</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {INSIGHT_NAV.map((item) => {
                    const Icon = item.icon;
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive(item.href)}
                          tooltip={item.label}
                        >
                          <Link href={item.href}>
                            <Icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="New message"
                  className="bg-brand text-on-brand hover:bg-brand-strong hover:text-on-brand"
                >
                  <Link href="/intake">
                    <PlusIcon />
                    <span>New message</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <div className="flex items-center justify-between gap-2 px-2 py-1.5 group-data-[collapsible=icon]:justify-center">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3 group-data-[collapsible=icon]:hidden">
                    theme
                  </span>
                  <ThemeToggle />
                </div>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <SidebarInset className="min-w-0">
          <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b border-line bg-paper/95 px-4 backdrop-blur md:px-6">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium text-ink">{current}</span>
            <div className="ml-auto md:hidden">
              <ThemeToggle />
            </div>
          </header>
          <div className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
