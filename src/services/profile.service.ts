import { ServiceError, type AffiliateProfile, type EditableProfileFields } from "@/types";
import { delay, readDb, updateDb } from "./mock/store";

export const profileService = {
  async getProfile(userId: string): Promise<AffiliateProfile | null> {
    await delay(200);
    return readDb().profiles.find((p) => p.id === userId) ?? null;
  },

  /** Chỉ cập nhật các trường CTV được phép sửa. */
  async updateProfile(
    userId: string,
    patch: EditableProfileFields,
  ): Promise<AffiliateProfile> {
    await delay();
    let updated: AffiliateProfile | undefined;
    updateDb((d) => {
      const p = d.profiles.find((x) => x.id === userId);
      if (!p) return;
      p.full_name = patch.full_name;
      p.phone = patch.phone;
      p.zalo = patch.zalo;
      p.bank_name = patch.bank_name;
      p.bank_account_number = patch.bank_account_number;
      p.bank_account_name = patch.bank_account_name;
      updated = { ...p };
    });
    if (!updated) throw new ServiceError("Không tìm thấy hồ sơ cộng tác viên.");
    return updated;
  },
};
