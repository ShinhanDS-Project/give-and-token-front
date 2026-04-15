const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

function buildQuery(params) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    const normalized = String(value).trim();
    if (normalized === "") {
      return;
    }

    query.set(key, normalized);
  });

  return query.toString();
}

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

function normalizeCampaign(campaign) {
  return {
    campaignNo: campaign.campaignNo,
    imagePath: campaign.imagePath || "",
    title: campaign.title || "제목 없음",
    foundationName: campaign.foundationName || "재단 정보 없음",
    targetAmount: Number(campaign.targetAmount || 0),
    currentAmount: Number(campaign.currentAmount || 0),
    category: campaign.category || "기타",
    endAt: campaign.endAt || null
  };
}

export async function getCampaignList({
  sort = "deadline",
  keyword = "",
  searchType = "",
  category = ""
} = {}) {
  const query = buildQuery({ sort, keyword, searchType, category });
  const path = query ? `/api/foundation/campaigns?${query}` : "/api/foundation/campaigns";

  const data = await request(path);
  return Array.isArray(data) ? data.map(normalizeCampaign) : [];
}
