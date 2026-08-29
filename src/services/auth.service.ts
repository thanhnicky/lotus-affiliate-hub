import { supabase } from "@/integrations/supabase/client";
import { ServiceError, type SignUpInput } from "@/types";

function translateAuthError(error: Error | { message?: string }): string {
  const msg = error?.message || "";
  if (msg.includes("User already registered") || msg.includes("already exists")) {
    return "Email này đã được đăng ký. Vui lòng đăng nhập hoặc sử dụng email khác.";
  }
  if (msg.includes("Invalid login credentials") || msg.includes("invalid_grant")) {
    return "Email hoặc mật khẩu không chính xác.";
  }
  if (msg.includes("Email not confirmed")) {
    return "Tài khoản chưa được xác nhận email. Vui lòng kiểm tra hộp thư của bạn.";
  }
  if (msg.includes("Password should be at least")) {
    return "Mật khẩu phải có ít nhất 6 ký tự.";
  }
  if (msg.includes("Too many requests") || msg.includes("rate limit")) {
    return "Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau giây lát.";
  }
  return msg || "Đã xảy ra lỗi trong quá trình xác thực.";
}

export const authService = {
  async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    if (error) throw new ServiceError(translateAuthError(error));
    if (!session) return null;
    return {
      user_id: session.user.id,
      email: session.user.email ?? "",
    };
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      throw new ServiceError(translateAuthError(error));
    }
    return {
      user_id: data.user.id,
      email: data.user.email ?? "",
      user: data.user,
      session: data.session,
    };
  },

  async signUp(input: SignUpInput) {
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "";

    const options: {
      emailRedirectTo?: string;
      data: {
        full_name: string;
        phone: string;
        zalo_id: string;
        terms_accepted: boolean;
      };
    } = {
      data: {
        full_name: input.full_name.trim(),
        phone: input.phone.trim(),
        zalo_id: input.zalo.trim(),
        terms_accepted: true,
      },
    };

    if (origin) {
      options.emailRedirectTo = `${origin}/login`;
    }

    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options,
    });

    if (error) {
      if (import.meta.env.DEV) {
        console.error("[Auth SignUp Error]", {
          name: error.name,
          message: error.message,
          status: error.status,
        });
      }
      throw new ServiceError(translateAuthError(error));
    }

    return {
      user: data.user,
      session: data.session,
      needsEmailConfirmation: Boolean(data.user && !data.session),
    };
  },



  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Lỗi đăng xuất:", error);
    }
  },

  async requestPasswordReset(email: string): Promise<void> {
    if (!email.trim()) throw new ServiceError("Vui lòng nhập địa chỉ email.");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw new ServiceError(translateAuthError(error));
  },
};

