import { supabase } from "@/integrations/supabase/client";
import { ServiceError, type Withdrawal, type WithdrawalInput } from "@/types";
import { linksService } from "./links.service";

export const withdrawalsService = {
  async listWithdrawals(affiliateId: string): Promise<Withdrawal[]> {
    if (!affiliateId) return [];

    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new ServiceError(error.message || "Không thể tải danh sách yêu cầu rút tiền.");
      }

      return (data ?? []).map((w: any) => ({
        id: w.id,
        affiliate_id: w.affiliate_id,
        amount: Number(w.amount ?? 0),
        bank_name: w.bank_name || "",
        bank_account: w.bank_account || w.bank_account_number || "",
        bank_holder: w.bank_holder || w.bank_account_name || "",
        note: w.note || null,
        status: w.status || "requested",
        created_at: w.created_at,
      }));
    } catch (err: any) {
      throw new ServiceError(err?.message || "Không thể tải danh sách yêu cầu rút tiền.");
    }
  },

  async requestWithdrawal(affiliateId: string, input: WithdrawalInput): Promise<Withdrawal> {
    if (!affiliateId) {
      throw new ServiceError("Thiếu mã định danh cộng tác viên.");
    }

    const stats = await linksService.getDashboardStats(affiliateId);
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new ServiceError("Số tiền rút không hợp lệ.");
    }
    if (input.amount > stats.available_commission) {
      throw new ServiceError("Số tiền rút vượt quá số dư có thể rút.");
    }
    if (!input.bank_name || !input.bank_account || !input.bank_holder) {
      throw new ServiceError("Vui lòng nhập đầy đủ thông tin ngân hàng.");
    }

    const payload = {
      affiliate_id: affiliateId,
      amount: input.amount,
      bank_name: input.bank_name.trim(),
      bank_account: input.bank_account.trim(),
      bank_holder: input.bank_holder.trim(),
      note: input.note?.trim() || null,
      status: "requested",
    };

    const { data, error } = await supabase
      .from("withdrawals")
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new ServiceError(error.message || "Không thể gửi yêu cầu rút tiền.");
    }

    return {
      id: data.id,
      affiliate_id: data.affiliate_id,
      amount: Number(data.amount),
      bank_name: data.bank_name,
      bank_account: data.bank_account,
      bank_holder: data.bank_holder,
      note: data.note,
      status: data.status,
      created_at: data.created_at,
    };
  },
};

