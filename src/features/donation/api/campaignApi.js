import { BookOpen, Droplets, HeartPulse, Leaf, PawPrint, Sparkles } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const FALLBACK_CAMPAIGN_IMAGE =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2070&auto=format&fit=crop";

const CATEGORY_VISUALS = {
  "식수 지원": { icon: Droplets, color: "text-blue-400" },
  "교육 지원": { icon: BookOpen, color: "text-primary" },
  "의료 지원": { icon: HeartPulse, color: "text-secondary" },
  동물: { icon: PawPrint, color: "text-amber-500" },
  환경: { icon: Leaf, color: "text-emerald-500" }
};

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

function toNumber(value) {
  const converted = Number(value ?? 0);
  return Number.isFinite(converted) ? converted : 0;
}

function toProgress(currentAmount, targetAmount) {
  if (targetAmount <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.floor((currentAmount / targetAmount) * 100)));
}

function normalizeImagePath(imagePath) {
  if (!imagePath) {
    return FALLBACK_CAMPAIGN_IMAGE;
  }

  const rawPath = String(imagePath).trim();
  if (!rawPath) {
    return FALLBACK_CAMPAIGN_IMAGE;
  }

  if (/^(https?:\/\/|data:image\/|blob:)/i.test(rawPath)) {
    return rawPath;
  }

  const noFileScheme = rawPath.replace(/^file:(\/\/\/|\/\/)?/i, "");
  const normalized = noFileScheme.replace(/\\/g, "/");
  const uploadMatch = normalized.match(/(?:^|\/)uploads\/(.+)$/i);
  if (uploadMatch) {
    const uploadPath = `/uploads/${uploadMatch[1].replace(/^\/+/, "")}`;
    return API_BASE_URL ? `${API_BASE_URL}${uploadPath}` : uploadPath;
  }

  if (/^[a-zA-Z]:\//.test(normalized)) {
    return FALLBACK_CAMPAIGN_IMAGE;
  }

  if (!API_BASE_URL) {
    return rawPath;
  }

  return rawPath.startsWith("/") ? `${API_BASE_URL}${rawPath}` : `${API_BASE_URL}/${rawPath}`;
}

function toCampaignCard(item) {
  const goal = toNumber(item.targetAmount);
  const raised = toNumber(item.currentAmount);
  const title = item.title || "캠페인";
  const category = item.category || "기타";
  const visuals = CATEGORY_VISUALS[category] || {
    icon: Sparkles,
    color: "text-primary"
  };

  return {
    id: toNumber(item.campaignNo),
    title,
    shortTitle: title,
    summary: item.foundationName ? `${item.foundationName} 캠페인` : "함께 만드는 기부",
    category,
    image: normalizeImagePath(item.imagePath),
    progress: toProgress(raised, goal),
    goal,
    raised,
    daysLeft: Number.isFinite(Number(item.daysLeft)) ? Number(item.daysLeft) : null,
    startDate:
      item.startAt ||
      item.recruitStartDate ||
      item.startDate ||
      null,
    endDate:
      item.endAt ||
      item.recruitEndDate ||
      item.endDate ||
      item.deadline ||
      item.finishDate ||
      item.targetDate ||
      null,
    donors: 0,
    foundationName: item.foundationName || "",
    icon: visuals.icon,
    color: visuals.color
  };
}

export async function getCampaignCards({
  sort = "deadline",
  keyword = "",
  category = ""
} = {}) {
  const query = new URLSearchParams();

  if (sort) {
    query.set("sort", sort);
  }
  if (keyword?.trim()) {
    query.set("keyword", keyword.trim());
  }
  if (category?.trim() && category.trim() !== "전체") {
    query.set("category", category.trim());
  }

  const path = query.toString()
    ? `/api/foundation/campaigns?${query.toString()}`
    : "/api/foundation/campaigns";
  const response = await request(path);

  return Array.isArray(response) ? response.map(toCampaignCard) : [];
}

export function buildCampaignCategories(campaigns) {
  return ["전체", ...new Set(campaigns.map((campaign) => campaign.category).filter(Boolean))];
}
