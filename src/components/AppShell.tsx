import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, LinkIcon, PlusCircle, User, LogOut, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useProfile, useSignOut } from "@/lib/session";
import { LotusMark } from "@/components/LotusMark";

const NAV = [
  { to: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/create-link", label: "Tạo link", icon: PlusCircle },
  { to: "/links", label: "Link của tôi", icon: LinkIcon },
  { to: "/profile", label: "Hồ sơ", icon: User },
] as const;

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useProfile();
  const signOut = useSignOut();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-soft">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <LotusMark className="h-8 w-8" />
            <span className="font-display text-lg font-semibold tracking-tight">Lotus CTV</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground",
                  pathname === item.to && "bg-primary/10 text-primary",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {profile?.full_name || profile?.email}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void signOut()}
              aria-label="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Mở menu"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {open ? (
          <nav className="grid gap-1 border-t border-border/70 bg-background p-3 md:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground",
                  pathname === item.to && "bg-primary/10 text-primary",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 md:pb-12">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground md:text-base">{description}</p>
          ) : null}
        </div>
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground",
              pathname === item.to && "text-primary",
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
