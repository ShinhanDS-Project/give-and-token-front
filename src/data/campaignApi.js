const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const CATEGORY_OPTIONS = [
  { value: "CHILD_YOUTH", label: "CHILD_YOUTH" },
  { value: "SENIOR", label: "SENIOR" },
  { value: "DISABLED", label: "DISABLED" },
  { value: "ANIMAL", label: "ANIMAL" },
  { value: "ENVIRONMENT", label: "ENVIRONMENT" },
  { value: "ETC", label: "ETC" }
];

function request(path, init) {
  return fetch(`${API_BASE_URL}${path}`, init).then(async (response) => {
    if (!response.ok) {
      throw new Error((await response.text()) || `API request failed: ${response.status}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  });
}

export function getCategoryOptions() {
  return CATEGORY_OPTIONS;
}

export async function getCampaigns({
  sort = "deadline",
  searchType = "title",
  keyword = "",
  category = ""
} = {}) {
  const query = new URLSearchParams();
  query.set("sort", sort);

  if (searchType) query.set("searchType", searchType);
  if (keyword) query.set("keyword", keyword);
  if (category) query.set("category", category);

  return request(`/api/foundation/campaigns?${query.toString()}`);
}

export async function getCampaignDetail(campaignNo) {
  return request(`/api/foundation/campaigns/${campaignNo}/detail`);
}

export async function checkCampaignBeneficiary(entryCode) {
  return request(
    `/api/foundation/campaigns/beneficiary-check?entryCode=${encodeURIComponent(entryCode)}`
  );
}

export async function checkCampaignFoundation(foundationNo) {
  return request(
    `/api/foundation/campaigns/foundation-check?foundationNo=${encodeURIComponent(foundationNo)}`
  );
}

export async function registerCampaign({
  dto,
  imageFile,
  detailImageFiles = [],
  foundationNo
}) {
  const formData = new FormData();
  formData.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));

  if (imageFile) {
    formData.append("imageFile", imageFile);
  }

  detailImageFiles.forEach((file) => {
    formData.append("detailImageFiles", file);
  });

  return request(`/api/foundation/campaigns/register?foundationNo=${foundationNo}`, {
    method: "POST",
    body: formData
  });
}
