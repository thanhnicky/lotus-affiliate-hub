import {
  ServiceError,
  type AffiliateLink,
  type CreateLinkInput,
  type DashboardStats,
  type LandingPage,
} from "@/types";
import { LANDING_PAGES, delay, readDb, uid, updateDb } from "./mock/store";

export const linksService = {
  async listLandingPages(): Promise<LandingPage[]> {
    await delay(150);
    return LANDING_PAGES;
  },

  async listLinks(userId: string): Promise<AffiliateLink[]> {
    await delay(250);
    return readDb()
      .links.filter((l) => l.affiliate_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  /**
   * Tương đương RPC create_affiliate_link trên Supabase:
   * affiliate_id luôn lấy từ phiên đăng nhập, không nhận từ form.
   */
  async createLink(userId: string, input: CreateLinkInput): Promise<AffiliateLink> {
    await delay();
    const db = readDb();
    const profile = db.profiles.find((p) => p.id === userId);
    if (!profile) throw new ServiceError("Không tìm thấy hồ sơ cộng tác viên.");
    if (profile.status !== "active")
      throw new ServiceError("Tài khoản chưa được duyệt nên chưa thể tạo link.");
    const page = LANDING_PAGES.find((p) => p.id === input.landing_page_id);
    if (!page) throw new ServiceError("Vui lòng chọn landing page.");

    const params = new URLSearchParams({
      ref: profile.affiliate_code,
      utm_source: input.channel,
    });
    const campaign = input.campaign?.trim();
    if (campaign) params.set("utm_campaign", campaign);

    const link: AffiliateLink = {
      id: uid("lnk"),
      affiliate_id: userId,
      landing_page_id: page.id,
      landing_page_name: page.name,
      channel: input.channel,
      campaign: campaign || null,
      full_url: `${page.base_url}?${params.toString()}`,
      clicks: 0,
      leads: 0,
      orders: 0,
      revenue: 0,
      commission: 0,
      created_at: new Date().toISOString(),
    };
    updateDb((d) => {
      d.links.push(link);
    });
    return link;
  },

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    await delay(250);
    const db = readDb();
    const links = db.links.filter((l) => l.affiliate_id === userId);
    const totals = links.reduce(
      (acc, l) => ({
        clicks: acc.clicks + l.clicks,
        leads: acc.leads + l.leads,
        orders: acc.orders + l.orders,
        commission: acc.commission + l.commission,
      }),
      { clicks: 0, leads: 0, orders: 0, commission: 0 },
    );
    const withdrawn = db.withdrawals
      .filter((w) => w.affiliate_id === userId && w.status !== "rejected")
      .reduce((s, w) => s + w.amount, 0);
    // Hoa hồng của đơn trong 14 ngày gần nhất coi như đang chờ đối soát.
    const cutoff = Date.now() - 14 * 86400000;
    const pending = links
      .filter((l) => new Date(l.created_at).getTime() > cutoff)
      .reduce((s, l) => s + l.commission, 0);
    return {
      clicks: totals.clicks,
      leads: totals.leads,
      orders: totals.orders,
      pending_commission: pending,
      available_commission: Math.max(totals.commission - pending - withdrawn, 0),
    };
  },
};
