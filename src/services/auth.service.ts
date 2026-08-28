/**
 * Lớp dịch vụ xác thực. Hiện dùng mock localStorage.
 * Khi gắn Supabase: thay phần thân hàm bằng supabase.auth.* và bảng profiles,
 * giữ nguyên chữ ký hàm để UI không phải sửa.
 */
import { ServiceError, type AuthSession, type SignUpInput } from "@/types";
import { delay, readDb, uid, updateDb } from "./mock/store";

function makeAffiliateCode() {
  return `LTS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

export const authService = {
  async getSession(): Promise<AuthSession | null> {
    await delay(120);
    return readDb().session;
  },

  async signIn(email: string, password: string): Promise<AuthSession> {
    await delay();
    const db = readDb();
    const cred = db.credentials.find(
      (c) => c.email.toLowerCase() === email.trim().toLowerCase() && c.password === password,
    );
    if (!cred) throw new ServiceError("Email hoặc mật khẩu chưa đúng.");
    const session: AuthSession = { user_id: cred.user_id, email: cred.email };
    updateDb((d) => {
      d.session = session;
    });
    return session;
  },

  async signUp(input: SignUpInput): Promise<AuthSession> {
    await delay();
    const db = readDb();
    if (db.credentials.some((c) => c.email.toLowerCase() === input.email.trim().toLowerCase())) {
      throw new ServiceError("Email này đã được đăng ký.");
    }
    const userId = uid("ctv");
    const session: AuthSession = { user_id: userId, email: input.email.trim() };
    updateDb((d) => {
      d.credentials.push({ email: session.email, password: input.password, user_id: userId });
      d.profiles.push({
        id: userId,
        affiliate_code: makeAffiliateCode(),
        full_name: input.full_name,
        phone: input.phone,
        zalo: input.zalo,
        email: session.email,
        bank_name: "",
        bank_account_number: "",
        bank_account_name: "",
        commission_rate: 0,
        status: "pending",
        role: "affiliate",
        created_at: new Date().toISOString(),
      });
      d.session = session;
    });
    return session;
  },

  async signOut(): Promise<void> {
    await delay(150);
    updateDb((d) => {
      d.session = null;
    });
  },

  async requestPasswordReset(email: string): Promise<void> {
    await delay();
    if (!email.trim()) throw new ServiceError("Vui lòng nhập email.");
  },
};
