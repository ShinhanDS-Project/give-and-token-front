const FOUNDATION_BASE_PATH = "/api/foundation";
const FOUNDATION_CAMPAIGN_BASE_PATH = "/api/foundation/campaigns";

export const FOUNDATION_AUTH_STORAGE_KEY = "foundationAccessToken";
export const FOUNDATION_INFO_STORAGE_KEY = "foundationAuthInfo";

async function parseErrorResponse(response) {
  const toKoreanMessage = (message) => {
    const normalized = String(message || "").toLowerCase();
    if (normalized.includes("insufficient token balance")) {
      return "토큰 잔액이 부족합니다.";
    }
    return message;
  };

  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const data = await response.json();
    return toKoreanMessage(
      data.message || data.error || "요청 처리 중 오류가 발생했습니다.",
    );
  }

  const text = await response.text();
  return toKoreanMessage(text || "요청 처리 중 오류가 발생했습니다.");
}

function getStoredAccessToken() {
  return (
    window.localStorage.getItem(FOUNDATION_AUTH_STORAGE_KEY) ||
    window.localStorage.getItem("accessToken") ||
    ""
  );
}

function parseJwtPayload(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = window.atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function getFoundationNoForGuard() {
  const storedAuth = getStoredFoundationAuth();
  if (storedAuth?.foundationNo) {
    return storedAuth.foundationNo;
  }

  const payload = parseJwtPayload(getStoredAccessToken());
  if (payload?.no) {
    return Number(payload.no);
  }

  return null;
}

function saveFoundationAuth(authResponse) {
  window.localStorage.setItem(
    FOUNDATION_AUTH_STORAGE_KEY,
    authResponse.accessToken,
  );
  window.localStorage.setItem("accessToken", authResponse.accessToken);
  window.localStorage.setItem(
    FOUNDATION_INFO_STORAGE_KEY,
    JSON.stringify({
      foundationNo: authResponse.foundationNo,
      foundationName: authResponse.foundationName,
      email: authResponse.email,
      tokenType: authResponse.tokenType,
    }),
  );
}

export function clearFoundationAuth() {
  window.localStorage.removeItem(FOUNDATION_AUTH_STORAGE_KEY);
  window.localStorage.removeItem(FOUNDATION_INFO_STORAGE_KEY);
  window.localStorage.removeItem("accessToken");
  window.localStorage.removeItem("userRole");
}

function buildAuthorizedHeaders() {
  const accessToken = getStoredAccessToken();

  if (!accessToken) {
    throw new Error("로그인이 필요합니다. 먼저 로그인해주세요.");
  }

  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

async function requestWithFoundationAuth(path) {
  const response = await fetch(path, {
    headers: buildAuthorizedHeaders(),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

function formatDateWithFixedTime(value, fixedTime) {
  if (!value) {
    return null;
  }

  const dateOnly = String(value).split("T")[0];
  return `${dateOnly}T${fixedTime}`;
}

export function getStoredFoundationAuth() {
  const raw = window.localStorage.getItem(FOUNDATION_INFO_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function loginFoundationAccount({ email, password }) {
  const response = await fetch(`${FOUNDATION_BASE_PATH}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  const data = await response.json();
  saveFoundationAuth(data);
  return data;
}

export async function logoutFoundationAccount() {
  const accessToken = getStoredAccessToken();

  try {
    if (accessToken) {
      await fetch(`${FOUNDATION_BASE_PATH}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    }
  } finally {
    clearFoundationAuth();
  }
}

export async function checkBeneficiary(entryCode) {
  const query = new URLSearchParams({
    entryCode: String(entryCode || "").trim(),
  });

  const response = await fetch(
    `${FOUNDATION_CAMPAIGN_BASE_PATH}/beneficiary-check?${query.toString()}`,
    {
      headers: buildAuthorizedHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export function getFoundationNoFromAccessToken() {
  const payload = parseJwtPayload(getStoredAccessToken());
  if (payload?.no) {
    return Number(payload.no);
  }
  return null;
}

export async function checkFoundationWalletAvailability() {
  const foundationNo = getFoundationNoForGuard();

  if (!foundationNo) {
    throw new Error(
      "기부단체 로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.",
    );
  }

  const query = new URLSearchParams({
    foundationNo: String(foundationNo),
  });

  const response = await fetch(
    `${FOUNDATION_CAMPAIGN_BASE_PATH}/foundation-check?${query.toString()}`,
    {
      headers: buildAuthorizedHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function fetchFoundationMyInfo() {
  const myInfo = await requestWithFoundationAuth(`${FOUNDATION_BASE_PATH}/me`);

  const foundationNo = myInfo?.foundationNo || getFoundationNoFromAccessToken();
  if (!foundationNo) {
    return myInfo;
  }

  try {
    const publicDetail = await fetchFoundationPublicDetail(foundationNo);
    return {
      ...myInfo,
      bankName: publicDetail?.bankName ?? myInfo?.bankName ?? "",
      feeRate: publicDetail?.feeRate ?? myInfo?.feeRate ?? null,
    };
  } catch {
    // /me 조회는 유지하고, 공개 상세 조회 실패 시에는 기존 myInfo를 그대로 사용한다.
    return myInfo;
  }
}

export async function fetchFoundationPublicDetail(foundationNo) {
  const response = await fetch(`${FOUNDATION_BASE_PATH}/${foundationNo}`);

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function fetchFoundationWalletInfo(foundationNo) {
  const response = await fetch(
    `${FOUNDATION_BASE_PATH}/${foundationNo}/wallet`,
  );

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function fetchFoundationSettlements({ page = 0, size = 10 } = {}) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  return requestWithFoundationAuth(
    `${FOUNDATION_BASE_PATH}/me/settlements?${query.toString()}`,
  );
}

export async function fetchFoundationRedemptions({ page = 0, size = 10 } = {}) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: "requestedAt,desc",
  });

  return requestWithFoundationAuth(
    `${FOUNDATION_BASE_PATH}/me/redemptions?${query.toString()}`,
  );
}

export async function requestFoundationRedemption({ requesterNo, amount }) {
  const response = await fetch("/api/redemptions", {
    method: "POST",
    headers: {
      ...buildAuthorizedHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requesterType: "FOUNDATION",
      requesterNo: Number(requesterNo),
      amount: Number(amount),
    }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function fetchFoundationMyStats() {
  return requestWithFoundationAuth(`${FOUNDATION_BASE_PATH}/me/stats`);
}

export async function updateFoundationMyInfo(formValues) {
  const multipartData = new FormData();
  const requestData = {
    description: String(formValues.description || "").trim(),
    contactPhone: String(formValues.contactPhone || "").trim(),
    account: String(formValues.account || "").trim(),
    bankName: String(formValues.bankName || "").trim(),
    feeRate: Number(formValues.feeRate),
  };

  multipartData.append(
    "data",
    new Blob([JSON.stringify(requestData)], { type: "application/json" }),
  );

  if (formValues.profileImageFile) {
    multipartData.append("profileImage", formValues.profileImageFile);
  }

  const response = await fetch(`${FOUNDATION_BASE_PATH}/me`, {
    method: "PATCH",
    headers: buildAuthorizedHeaders(),
    body: multipartData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function updateFoundationPassword({
  currentPassword,
  newPassword,
}) {
  const response = await fetch(`${FOUNDATION_BASE_PATH}/me/password`, {
    method: "PATCH",
    headers: {
      ...buildAuthorizedHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currentPassword: String(currentPassword || "").trim(),
      newPassword: String(newPassword || "").trim(),
    }),
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }
}

export async function fetchFoundationRecentCampaigns({
  campaignStatus,
  keyword = "",
  page = 0,
  size = 2,
} = {}) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(size),
    keyword,
  });

  if (campaignStatus) {
    query.set("campaignStatus", campaignStatus);
  }

  return requestWithFoundationAuth(
    `${FOUNDATION_BASE_PATH}/me/campaigns/filter?${query.toString()}`,
  );
}

export async function fetchCampaignDetail(campaignNo) {
  return requestWithFoundationAuth(
    `${FOUNDATION_CAMPAIGN_BASE_PATH}/${campaignNo}/detail`,
  );
}

export async function fetchCampaignDetailPublic(campaignNo) {
  const response = await fetch(
    `${FOUNDATION_CAMPAIGN_BASE_PATH}/${campaignNo}/detail`,
  );

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function fetchPendingCampaignEditDetail(campaignNo) {
  return requestWithFoundationAuth(
    `${FOUNDATION_CAMPAIGN_BASE_PATH}/${campaignNo}/edit-detail`,
  );
}

function buildCampaignMultipartData(formValues) {
  const multipartData = new FormData();

  const requestData = {
    title: formValues.title.trim(),
    description: formValues.description.trim(),
    category: formValues.category,
    entryCode: formValues.entryCode.trim(),
    targetAmount: Number(formValues.targetAmount),
    startAt: formatDateWithFixedTime(formValues.startAt, "00:00:00"),
    endAt: formatDateWithFixedTime(formValues.endAt, "23:59:59"),
    usageStartAt: formatDateWithFixedTime(formValues.usageStartAt, "00:00:00"),
    usageEndAt: formatDateWithFixedTime(formValues.usageEndAt, "23:59:59"),
    usePlans: formValues.usePlans
      .map((plan) => ({
        planContent: plan.planContent.trim(),
        planAmount: Number(plan.planAmount),
      }))
      .filter((plan) => plan.planContent && !Number.isNaN(plan.planAmount)),
    deletedDetailImageNos: Array.isArray(formValues.deletedDetailImageNos)
      ? formValues.deletedDetailImageNos
          .map((imageNo) => Number(imageNo))
          .filter((imageNo) => Number.isFinite(imageNo) && imageNo > 0)
      : [],
  };

  multipartData.append(
    "dto",
    new Blob([JSON.stringify(requestData)], { type: "application/json" }),
  );

  if (formValues.imageFile) {
    multipartData.append("imageFile", formValues.imageFile);
  }

  formValues.detailImageFiles.forEach((imageFile) => {
    if (imageFile) {
      multipartData.append("detailImageFiles", imageFile);
    }
  });

  return multipartData;
}

export async function submitCampaignApplication(formValues) {
  const multipartData = buildCampaignMultipartData(formValues);

  const response = await fetch(`${FOUNDATION_CAMPAIGN_BASE_PATH}/register`, {
    method: "POST",
    headers: buildAuthorizedHeaders(),
    body: multipartData,
  });

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}

export async function updatePendingCampaign(campaignNo, formValues) {
  const multipartData = buildCampaignMultipartData(formValues);

  const response = await fetch(
    `${FOUNDATION_CAMPAIGN_BASE_PATH}/${campaignNo}`,
    {
      method: "PUT",
      headers: buildAuthorizedHeaders(),
      body: multipartData,
    },
  );

  if (!response.ok) {
    throw new Error(await parseErrorResponse(response));
  }

  return response.json();
}
