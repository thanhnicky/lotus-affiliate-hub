import { ServiceError, type Withdrawal, type WithdrawalInput } from "@/types";
import { delay, readDb, uid, updateDb } from "./mock/store";
import { linksService } from "./links.service";

export const withdrawalsService = {
  async listWithdrawals(userId: string): Promise<Withdrawal[]> {
    await delay(250);
    return readDb()
      .withdrawals.filter((w) => w.affiliate_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async requestWithdrawal(userId: string, input: WithdrawalInput): Promise<Withdrawal> {
    await delay();
    const stats = await linksService.getDashboardStats(userId);
    if (!Number.isFinite(input.amount) || input.amount <= 0)
      throw new ServiceError("Số tiền rút không hợp lệ.");
    if (input.amount > stats.available_commission)
      throw new ServiceError("Số tiền rút vượt quá số dư có thể rút.");
    if (!input.bank_name || !input.bank_account_number || !input.bank_account_name)
      throw new ServiceError("Vui lòng nhập đầy đủ thông tin ngân hàng.");

    const withdrawal: Withdrawal = {
      id: uid("wd"),
      affiliate_id: userId,
      amount: input.amount,
      bank_name: input.bank_name,
      bank_account_number: input.bank_account_number,
      bank_account_name: input.bank_account_name,
      note: input.note?.trim() || null,
      status: "requested",
      created_at: new Date().toISOString(),
    };
    updateDb((d) => {
      d.withdrawals.push(withdrawal);
    });
    return withdrawal;
  },
};
