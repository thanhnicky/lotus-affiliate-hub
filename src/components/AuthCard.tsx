import type { ReactNode } from "react";

import { LotusMark } from "@/components/LotusMark";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-soft">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <LotusMark className="h-16 w-auto" />
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card md:p-8">
          {children}
        </div>
        {footer ? <div className="mt-6 text-center">{footer}</div> : null}
      </div>
    </div>
  );
}
