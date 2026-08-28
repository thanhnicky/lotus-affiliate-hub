import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CardsSkeleton, EmptyState, ErrorState } from "@/components/states";
import { useProfile } from "@/hooks/useAuth";
import { WITHDRAWAL_STATUS_LABEL, linksService, withdrawalsService } from "@/services";
import { formatDate, formatVnd } from "@/lib/format";
import type { WithdrawalStatus } from "@/types";

const STATUS_CLASS: Record<WithdrawalStatus, string> = {
  requested: "bg-warning/15 text-warning-foreground",
  approved: "bg-primary/10 text-primary",
  paid: "bg-success/15 text-success-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

export function WithdrawalsPage() {
  const { data: profile, session } = useProfile();
  const userId = session?.user_id;
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!profile) return;
    setBankName((v) => v || profile.bank_name);
    setAccountNumber((v) => v || profile.bank_account_number);
    setAccountName((v) => v || profile.bank_account_name);
  }, [profile]);

  const statsQuery = useQuery({
    queryKey: ["stats", userId],
    queryFn: () => linksService.getDashboardStats(userId!),
    enabled: Boolean(userId),
  });

  const listQuery = useQuery({
    queryKey: ["withdrawals", userId],
    queryFn: () => withdrawalsService.listWithdrawals(userId!),
    enabled: Boolean(userId),
  });

  const request = useMutation({
    mutationFn: () =>
      withdrawalsService.requestWithdrawal(userId!, {
        amount: Number(amount.replace(/\D/g, "")),
        bank_name: bankName,
        bank_account_number: accountNumber,
        bank_account_name: accountName,
        note,
      }),
    onSuccess: () => {
      setAmount("");
      setNote("");
      void queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Đã gửi yêu cầu rút tiền", { description: "Lotus sẽ xử lý trong 1-3 ngày làm việc." });
    },
    onError: (e: Error) => toast.error("Không gửi được yêu cầu", { description: e.message }),
  });

  return (
    <AppLayout title="Rút tiền" description="Yêu cầu tất toán hoa hồng và theo dõi lịch sử rút tiền.">
      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-3xl bg-brand p-6 text-primary-foreground shadow-lift">
            <div className="flex items-center gap-2 opacity-90">
              <Wallet className="h-4 w-4" />
              <span className="text-xs">Số dư có thể rút</span>
            </div>
            <p className="mt-3 font-display text-3xl font-semibold tracking-tight">
              {statsQuery.isLoading ? "…" : formatVnd(statsQuery.data?.available_commission ?? 0)}
            </p>
            <p className="mt-2 text-xs opacity-80">
              Hoa hồng chờ đối soát: {formatVnd(statsQuery.data?.pending_commission ?? 0)}
            </p>
          </div>

          <form
            className="space-y-4 rounded-3xl border border-border/70 bg-card p-6 shadow-card"
            onSubmit={(e) => {
              e.preventDefault();
              request.mutate();
            }}
          >
            <h2 className="font-display text-lg font-semibold">Yêu cầu rút tiền</h2>
            <div className="space-y-2">
              <Label htmlFor="amount">Số tiền muốn rút (VND)</Label>
              <Input
                id="amount"
                inputMode="numeric"
                className="h-12"
                placeholder="1.000.000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bank">Ngân hàng</Label>
              <Input id="bank" className="h-12" value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account">Số tài khoản</Label>
              <Input
                id="account"
                inputMode="numeric"
                className="h-12"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="account-name">Chủ tài khoản</Label>
              <Input
                id="account-name"
                className="h-12"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Ghi chú (tuỳ chọn)</Label>
              <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
            <Button type="submit" className="h-12 w-full" disabled={request.isPending}>
              {request.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Gửi yêu cầu
            </Button>
          </form>
        </div>

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">Lịch sử yêu cầu rút</h2>
          {listQuery.isError ? (
            <ErrorState onRetry={() => void listQuery.refetch()} />
          ) : listQuery.isLoading ? (
            <CardsSkeleton count={3} />
          ) : (listQuery.data ?? []).length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-5 w-5" />}
              title="Chưa có yêu cầu rút tiền"
              description="Khi hoa hồng đã đối soát, bạn có thể gửi yêu cầu rút tại đây."
            />
          ) : (
            <ul className="grid gap-3">
              {(listQuery.data ?? []).map((w) => (
                <li key={w.id} className="rounded-2xl border border-border/70 bg-card p-4 shadow-card">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-lg font-semibold">{formatVnd(w.amount)}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[w.status]}`}>
                      {WITHDRAWAL_STATUS_LABEL[w.status]}
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground">{formatDate(w.created_at)}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {w.bank_name} · {w.bank_account_number} · {w.bank_account_name}
                  </p>
                  {w.note ? <p className="mt-1 text-sm text-muted-foreground">Ghi chú: {w.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
