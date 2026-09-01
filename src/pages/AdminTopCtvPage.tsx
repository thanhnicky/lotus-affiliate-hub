import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Save, Trash2, GripVertical, Eye, EyeOff } from "lucide-react";

import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState, LoadingState, EmptyState } from "@/components/states";
import { adminService } from "@/services";
import type { TopCtvEntry } from "@/types";

export function AdminTopCtvPage() {
  const queryClient = useQueryClient();
  const [entries, setEntries] = useState<TopCtvEntry[]>([]);
  const [dirty, setDirty] = useState(false);

  const query = useQuery({
    queryKey: ["admin-top-ctv"],
    queryFn: async () => {
      const data = await adminService.listTopCtv();
      return data;
    },
  });

  // Sync query data to local state — only when not dirty (user hasn't edited)
  useEffect(() => {
    if (query.data && !dirty) {
      setEntries(query.data);
    }
  }, [query.data, dirty]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const entry of entries) {
        // New entries (id starts with "new-") don't have a real UUID yet.
        // Pass them without id so the DB generates one via gen_random_uuid().
        const isNew = entry.id.startsWith("new-");
        // Format revenue_label: raw number -> VND string with thousand separators
        const rawRevenue = (entry.revenue_label || "").replace(/\D/g, "");
        const formattedRevenue = rawRevenue
          ? new Intl.NumberFormat("vi-VN").format(Number(rawRevenue)) + "đ"
          : "";
        const payload = { ...entry, revenue_label: formattedRevenue };
        await adminService.upsertTopCtv(isNew ? { ...payload, id: undefined } : payload);
      }
    },
    onSuccess: () => {
      toast.success("Đã lưu TOP CTV");
      setDirty(false);
      void queryClient.invalidateQueries({ queryKey: ["admin-top-ctv"] });
      void queryClient.invalidateQueries({ queryKey: ["top-ctv"] });
    },
    onError: (e: Error) => toast.error("Lưu không thành công", { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteTopCtv(id),
    onSuccess: () => {
      toast.success("Đã xoá");
      void queryClient.invalidateQueries({ queryKey: ["admin-top-ctv"] });
    },
    onError: (e: Error) => toast.error("Xoá không thành công", { description: e.message }),
  });

  const updateEntry = (id: string, field: keyof TopCtvEntry, value: string | number | boolean) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
    setDirty(true);
  };

  const addEntry = () => {
    const newEntry: TopCtvEntry = {
      id: `new-${Date.now()}`,
      rank: entries.length + 1,
      display_name: "",
      affiliate_code: "",
      revenue_label: "",
      orders_label: "",
      is_active: true,
    };
    setEntries((prev) => [...prev, newEntry]);
    setDirty(true);
  };

  const removeEntry = (id: string) => {
    if (id.startsWith("new-")) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setDirty(true);
      return;
    }
    if (confirm("Xoá entry này?")) {
      void deleteMutation.mutateAsync(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  return (
    <AppLayout
      title="TOP CTV"
      description="Quản lý bảng TOP CTV hiển thị trên trang chủ. Tối đa 6 CTV."
      actions={
        <Button
          onClick={() => void saveMutation.mutateAsync()}
          disabled={!dirty || saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Lưu thay đổi
        </Button>
      }
    >
      {query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <LoadingState label="Đang tải..." />
      ) : (
        <>
          <div className="rounded-2xl border border-border/50 bg-card p-4">
            <p className="text-sm text-muted-foreground">
              Điền thông tin CTV xuất sắc để hiển thị trên trang chủ. Chỉ những entry đang{" "}
              <strong>bật</strong> mới hiển thị. Sắp xếp theo hạng (1 = cao nhất).
            </p>
          </div>

          <div className="mt-6 space-y-4">
            {entries.length === 0 ? (
              <EmptyState
                icon={<Plus className="h-5 w-5" />}
                title="Chưa có TOP CTV nào"
                description="Bấm 'Thêm CTV' để tạo entry đầu tiên."
              />
            ) : (
              entries.map((entry, i) => (
                <TopCtvEditor
                  key={entry.id}
                  entry={entry}
                  index={i}
                  onChange={(field, value) => updateEntry(entry.id, field, value)}
                  onRemove={() => removeEntry(entry.id)}
                />
              ))
            )}
          </div>

          {entries.length < 6 ? (
            <Button variant="outline" className="mt-4" onClick={addEntry}>
              <Plus className="mr-2 h-4 w-4" />
              Thêm CTV
            </Button>
          ) : null}

          {dirty ? (
            <p className="mt-4 text-sm text-warning-foreground">
              Có thay đổi chưa lưu. Bấm "Lưu thay đổi" để cập nhật trang chủ.
            </p>
          ) : null}
        </>
      )}
    </AppLayout>
  );
}

function TopCtvEditor({
  entry,
  index,
  onChange,
  onRemove,
}: {
  entry: TopCtvEntry;
  index: number;
  onChange: (field: keyof TopCtvEntry, value: string | number | boolean) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span className="font-display text-sm font-semibold">CTV #{index + 1}</span>
          <button
            onClick={() => onChange("is_active", !entry.is_active)}
            className="ml-2 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
          >
            {entry.is_active ? (
              <>
                <Eye className="h-3 w-3 text-green-600" />
                <span className="text-green-700">Đang hiển thị</span>
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">Đang ẩn</span>
              </>
            )}
          </button>
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Xoá">
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs">Hạng</Label>
          <Input
            type="number"
            min={1}
            max={6}
            className="h-10"
            value={entry.rank}
            onChange={(e) => onChange("rank", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Tên hiển thị</Label>
          <Input
            className="h-10"
            placeholder="vd: Nguyễn V. T."
            value={entry.display_name}
            onChange={(e) => onChange("display_name", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Mã CTV</Label>
          <Input
            className="h-10"
            placeholder="vd: LTABC123"
            value={entry.affiliate_code}
            onChange={(e) => onChange("affiliate_code", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Hoa hồng ghi nhận (VNĐ)</Label>
          <Input
            className="h-10"
            inputMode="numeric"
            placeholder="vd: 45000000"
            value={entry.revenue_label}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              onChange("revenue_label", raw);
            }}
          />
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Số đơn hàng</Label>
          <Input
            className="h-10"
            placeholder="vd: 12 đơn"
            value={entry.orders_label}
            onChange={(e) => onChange("orders_label", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
