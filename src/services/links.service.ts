import { supabase } from "@/integrations/supabase/client";
import {
  ServiceError,
  type AffiliateLink,
  type CreateLinkInput,
  type DashboardStats,
  type LandingPage,
} from "@/types";

export const linksService = {
  async listLandingPages(): Promise<LandingPage[]> {
    try {
      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        // Fallback nếu schema không có cột sort_order
        const fallback = await supabase
          .from("landing_pages")
          .select("*")
          .eq("is_active", true);
        if (fallback.error) throw new ServiceError(fallback.error.message);
        return (fallback.data ?? []) as LandingPage[];
      }

      return (data ?? []) as LandingPage[];
    } catch (err: any) {
      throw new ServiceError(err?.message || "Không thể tải danh sách landing page.");
    }
  },

  async listLinks(affiliateId: string): Promise<AffiliateLink[]> {
    if (!affiliateId) return [];

    try {
      const { data, error } = await supabase
        .from("affiliate_links")
        .select("*, landing_pages(id, name)")
        .eq("affiliate_id", affiliateId)
        .order("created_at", { ascending: false });

      if (error) {
        const fallback = await supabase
          .from("affiliate_links")
          .select("*")
          .eq("affiliate_id", affiliateId)
          .order("created_at", { ascending: false });

        if (fallback.error) throw new ServiceError(fallback.error.message);

        return (fallback.data ?? []).map((l: any) => ({
          id: l.id,
          affiliate_id: l.affiliate_id,
          landing_page_id: l.landing_page_id,
          landing_page_name: l.landing_page_name || "Landing Page",
          channel: l.channel,
          campaign_name: l.campaign_name || l.campaign || null,
          affiliate_url: l.affiliate_url || l.full_url || "",
          clicks: Number(l.clicks ?? 0),
          conversions: Number(l.conversions ?? l.orders ?? l.leads ?? 0),
          total_revenue: Number(l.total_revenue ?? l.revenue ?? 0),
          commission: Number(l.commission ?? 0),
          created_at: l.created_at,
        }));
      }

      return (data ?? []).map((l: any) => ({
        id: l.id,
        affiliate_id: l.affiliate_id,
        landing_page_id: l.landing_page_id,
        landing_page_name: l.landing_page_name || l.landing_pages?.name || "Landing Page",
        channel: l.channel,
        campaign_name: l.campaign_name || l.campaign || null,
        affiliate_url: l.affiliate_url || l.full_url || "",
        clicks: Number(l.clicks ?? 0),
        conversions: Number(l.conversions ?? l.orders ?? l.leads ?? 0),
        total_revenue: Number(l.total_revenue ?? l.revenue ?? 0),
        commission: Number(l.commission ?? 0),
        created_at: l.created_at,
      }));
    } catch (err: any) {
      throw new ServiceError(err?.message || "Không thể tải danh sách link tiếp thị.");
    }
  },

  async createLink(input: CreateLinkInput): Promise<AffiliateLink> {
    const selectedLandingPageId = input.landing_page_id;
    const selectedChannel = input.channel;
    const campaignName = input.campaign_name || "";

    const { data, error } = await supabase.rpc("create_affiliate_link", {
      p_landing_page_id: selectedLandingPageId,
      p_channel: selectedChannel,
      p_campaign_name: campaignName.trim() || null,
    });

    if (error) {
      throw new ServiceError(error.message || "Không thể tạo link tiếp thị.");
    }

    let affiliateUrl = "";
    let linkRecord: any = null;

    if (typeof data === "string") {
      affiliateUrl = data;
    } else if (data && typeof data === "object") {
      linkRecord = Array.isArray(data) ? data[0] : data;
      affiliateUrl = linkRecord?.affiliate_url || linkRecord?.full_url || linkRecord?.url || "";
    }

    return {
      id: linkRecord?.id || "",
      affiliate_id: linkRecord?.affiliate_id || "",
      landing_page_id: selectedLandingPageId,
      channel: selectedChannel,
      campaign_name: campaignName.trim() || null,
      affiliate_url: affiliateUrl,
      created_at: linkRecord?.created_at || new Date().toISOString(),
    };
  },

  async getDashboardStats(affiliateId: string): Promise<DashboardStats> {
    if (!affiliateId) {
      return {
        clicks: 0,
        leads: 0,
        orders: 0,
        pending_commission: 0,
        available_commission: 0,
      };
    }

    try {
      const { data: affiliate } = await supabase
        .from("affiliates")
        .select("total_earnings, pending_earnings, paid_earnings")
        .eq("id", affiliateId)
        .maybeSingle();

      const { data: links } = await supabase
        .from("affiliate_links")
        .select("clicks, conversions")
        .eq("affiliate_id", affiliateId);

      const totalClicks = (links ?? []).reduce(
        (acc: number, cur: any) => acc + (Number(cur.clicks) || 0),
        0
      );
      const totalConversions = (links ?? []).reduce(
        (acc: number, cur: any) =>
          acc + (Number(cur.conversions ?? cur.orders ?? cur.leads) || 0),
        0
      );

      const totalEarnings = Number(affiliate?.total_earnings ?? 0);
      const pendingEarnings = Number(affiliate?.pending_earnings ?? 0);
      const paidEarnings = Number(affiliate?.paid_earnings ?? 0);
      const available = Math.max(totalEarnings - pendingEarnings - paidEarnings, 0);

      return {
        clicks: totalClicks,
        leads: totalConversions,
        orders: totalConversions,
        pending_commission: pendingEarnings,
        available_commission: available,
      };
    } catch (err: any) {
      return {
        clicks: 0,
        leads: 0,
        orders: 0,
        pending_commission: 0,
        available_commission: 0,
      };
    }
  },
};

