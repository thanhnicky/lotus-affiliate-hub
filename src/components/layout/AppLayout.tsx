import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  LinkIcon,
  PlusCircle,
  User,
  LogOut,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initialsOf } from "@/lib/format";
import { useAuth, useSignOut } from "@/hooks/useAuth";
import { LotusMark } from "@/components/LotusMark";

type NavItem = { to: string; label: string; icon: LucideIcon };

const NAV: NavItem[] = [
  { to: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { to: "/create-link", label: "Tạo link", icon: PlusCircle },
  { to: "/links", label: "Link của tôi", icon: LinkIcon },
  { to: "/withdrawals", label: "Rút tiền", icon: Wallet },
  { to: "/profile", label: "Hồ sơ", icon: User },
];

export function AppLayout({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { affiliate } = useAuth();
  const signOut = useSignOut();

  return (
    <div className="min-h-screen bg-soft">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/70 bg-background/90 px-4 py-6 lg:flex">
        <Link to="/dashboard" className="flex items-center gap-2 px-2">
          <LotusMark className="h-9 w-9" />
          <span className="font-display text-lg font-semibold leading-tight tracking-tight">
            Lotus Affiliate
            <span className="block text-xs font-normal text-muted-foreground">Portal CTV</span>
          </span>
        </Link>

        <nav className="mt-8 grid gap-1">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground",
                pathname === item.to && "bg-primary/10 text-primary",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <Button
          variant="ghost"
          className="mt-auto justify-start text-muted-foreground"
          onClick={() => void signOut()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Đăng xuất
        </Button>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border/70 bg-background/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
            <Link to="/dashboard" className="flex items-center gap-2 lg:hidden">
              <LotusMark className="h-8 w-8" />
              <span className="font-display text-base font-semibold">Lotus Affiliate</span>
            </Link>

            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight">
                  {affiliate?.full_name ?? "Cộng tác viên"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Mã CTV: {affiliate?.affiliate_code ?? "—"}
                </p>
              </div>
              <Avatar className="h-9 w-9 border border-border">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {initialsOf(affiliate?.full_name ?? "")}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => void signOut()}
                aria-label="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-8 lg:pb-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-1 text-sm text-muted-foreground md:text-base">{description}</p>
              ) : null}
            </div>
            {actions}
          </div>
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground",
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

