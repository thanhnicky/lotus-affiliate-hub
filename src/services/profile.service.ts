import { supabase } from "@/integrations/supabase/client";
import { ServiceError, type Affiliate, type EditableProfileFields } from "@/types";

export const profileService = {
  async getProfile(userId: string): Promise<Affiliate | null> {
    if (!userId) return null;
    const { data, error } = await supabase
      .from("affiliates")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw new ServiceError(error.message || "Không thể lấy thông tin hồ sơ.");
    }
    return data as Affiliate | null;
  },

  /** Chỉ cập nhật các trường CTV được phép sửa. */
  async updateProfile(
    affiliateId: string,
    patch: EditableProfileFields
  ): Promise<Affiliate> {
    if (!affiliateId) {
      throw new ServiceError("Thiếu mã định danh cộng tác viên.");
    }

    // Chỉ lấy đúng 6 trường được phép chỉnh sửa
    const payload = {
      full_name: patch.full_name?.trim(),
      phone: patch.phone?.trim(),
      zalo_id: patch.zalo_id?.trim() || null,
      bank_name: patch.bank_name?.trim() || null,
      bank_account: patch.bank_account?.trim() || null,
      bank_holder: patch.bank_holder?.trim() || null,
    };

    const { data, error } = await supabase
      .from("affiliates")
      .update(payload)
      .eq("id", affiliateId)
      .select()
      .single();

    if (error) {
      throw new ServiceError(error.message || "Không thể cập nhật hồ sơ.");
    }

    return data as Affiliate;
  },
};

