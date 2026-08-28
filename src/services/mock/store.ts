/**
 * Kho dữ liệu mock chạy hoàn toàn phía trình duyệt (localStorage).
 * Chỉ phục vụ demo giao diện — không có backend nào được gọi.
 * Khi tích hợp Supabase, xoá thư mục services/mock và thay các service.
 */
import type {
  AffiliateLink,
  AffiliateProfile,
  AuthSession,
  LandingPage,
  Withdrawal,
} from "@/types";

const KEY = "lotus-affiliate-portal:v1";

export interface MockDb {
  profiles: AffiliateProfile[];
  credentials: { email: string; password: string; user_id: string }[];
  links: AffiliateLink[];
  withdrawals: Withdrawal[];
  session: AuthSession | null;
}

export const LANDING_PAGES: LandingPage[] = [
  {
    id: "lp-noi-that",
    name: "Sơn nội thất Lotus Silk",
    slug: "lotus-silk",
    product_line: "Nội thất",
    base_url: "https://sonlotus.vn/lotus-silk",
  },
  {
    id: "lp-ngoai-that",
    name: "Sơn ngoại thất Lotus Shield",
    slug: "lotus-shield",
    product_line: "Ngoại thất",
    base_url: "https://sonlotus.vn/lotus-shield",
  },
  {
    id: "lp-chong-tham",
    name: "Chống thấm Lotus Aqua",
    slug: "lotus-aqua",
    product_line: "Chống thấm",
    base_url: "https://sonlotus.vn/lotus-aqua",
  },
  {
    id: "lp-son-lot",
    name: "Sơn lót Lotus Prime",
    slug: "lotus-prime",
    product_line: "Sơn lót",
    base_url: "https://sonlotus.vn/lotus-prime",
  },
];

const DEMO_USER_ID = "demo-affiliate";

function demoDb(): MockDb {
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

  const demoProfile: AffiliateProfile = {
    id: DEMO_USER_ID,
    affiliate_code: "LTS-DEMO88",
    full_name: "Nguyễn Minh Anh",
    phone: "0901234567",
    zalo: "0901234567",
    email: "demo@lotus.vn",
    bank_name: "Vietcombank",
    bank_account_number: "0071000123456",
    bank_account_name: "NGUYEN MINH ANH",
    commission_rate: 0.08,
    status: "active",
    role: "affiliate",
    created_at: daysAgo(120),
  };

  const demoLinks: AffiliateLink[] = [
    {
      id: "lnk-1",
      affiliate_id: DEMO_USER_ID,
      landing_page_id: "lp-noi-that",
      landing_page_name: "Sơn nội thất Lotus Silk",
      channel: "zalo_personal",
      campaign: "tet-2026",
      full_url:
        "https://sonlotus.vn/lotus-silk?ref=LTS-DEMO88&utm_source=zalo_personal&utm_campaign=tet-2026",
      clicks: 248,
      leads: 31,
      orders: 9,
      revenue: 42_500_000,
      commission: 3_400_000,
      created_at: daysAgo(21),
    },
    {
      id: "lnk-2",
      affiliate_id: DEMO_USER_ID,
      landing_page_id: "lp-chong-tham",
      landing_page_name: "Chống thấm Lotus Aqua",
      channel: "facebook_group",
      campaign: "mua-mua",
      full_url:
        "https://sonlotus.vn/lotus-aqua?ref=LTS-DEMO88&utm_source=facebook_group&utm_campaign=mua-mua",
      clicks: 163,
      leads: 22,
      orders: 5,
      revenue: 18_900_000,
      commission: 1_512_000,
      created_at: daysAgo(12),
    },
    {
      id: "lnk-3",
      affiliate_id: DEMO_USER_ID,
      landing_page_id: "lp-ngoai-that",
      landing_page_name: "Sơn ngoại thất Lotus Shield",
      channel: "tiktok",
      campaign: null,
      full_url: "https://sonlotus.vn/lotus-shield?ref=LTS-DEMO88&utm_source=tiktok",
      clicks: 97,
      leads: 8,
      orders: 2,
      revenue: 9_600_000,
      commission: 768_000,
      created_at: daysAgo(4),
    },
  ];

  const demoWithdrawals: Withdrawal[] = [
    {
      id: "wd-1",
      affiliate_id: DEMO_USER_ID,
      amount: 1_000_000,
      bank_name: "Vietcombank",
      bank_account_number: "0071000123456",
      bank_account_name: "NGUYEN MINH ANH",
      note: null,
      status: "paid",
      created_at: daysAgo(30),
    },
    {
      id: "wd-2",
      affiliate_id: DEMO_USER_ID,
      amount: 500_000,
      bank_name: "Vietcombank",
      bank_account_number: "0071000123456",
      bank_account_name: "NGUYEN MINH ANH",
      note: "Rút đợt tháng này",
      status: "requested",
      created_at: daysAgo(3),
    },
  ];

  return {
    profiles: [demoProfile],
    credentials: [{ email: "demo@lotus.vn", password: "lotus123", user_id: DEMO_USER_ID }],
    links: demoLinks,
    withdrawals: demoWithdrawals,
    session: null,
  };
}

let memory: MockDb | null = null;

export function readDb(): MockDb {
  if (typeof window === "undefined") return memory ?? (memory = demoDb());
  const raw = window.localStorage.getItem(KEY);
  if (!raw) {
    const fresh = demoDb();
    window.localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    return JSON.parse(raw) as MockDb;
  } catch {
    const fresh = demoDb();
    window.localStorage.setItem(KEY, JSON.stringify(fresh));
    return fresh;
  }
}

export function writeDb(next: MockDb) {
  memory = next;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function updateDb(mutate: (db: MockDb) => void): MockDb {
  const db = readDb();
  mutate(db);
  writeDb(db);
  return db;
}

export function delay(ms = 450) {
  return new Promise((r) => setTimeout(r, ms));
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}
