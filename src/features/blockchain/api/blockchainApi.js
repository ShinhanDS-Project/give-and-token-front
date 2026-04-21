const DASHBOARD_PAGE_SIZE = 10;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const TRANSACTIONS_CACHE_TTL_MS = 60 * 1000;
const TRANSACTIONS_CACHE_PREFIX = "dashboard-transactions:api:v1";

const OWNER_TYPE_LABELS = {
  FOUNDATION: "재단",
  CAMPAIGN: "캠페인",
  BENEFICIARY: "수혜자",
  SERVER: "서버",
  DONOR: "기부자"
};
const OWNER_TYPE_BY_LABEL = Object.entries(OWNER_TYPE_LABELS).reduce((acc, [type, label]) => {
  acc[label] = type;
  return acc;
}, {});

const EVENT_TYPE_LABELS = {
  DONATION: "기부",
  SETTLEMENT: "정산",
  TOKENIZATION: "토큰화",
  GAS_CHARGE: "가스 충전",
  GAS_TOPUP: "가스 충전",
  GAS_RECHARGE: "가스 충전",
  CASHOUT: "출금",
  WITHDRAWAL: "출금"
};

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

function getWalletDisplayInfo(wallet) {
  if (!wallet) {
    return {
      nameLabel: "",
      nameValue: ""
    };
  }

  if (wallet.ownerType === "FOUNDATION") {
    return {
      nameLabel: "재단명",
      nameValue: wallet.foundationName || "-"
    };
  }

  if (wallet.ownerType === "CAMPAIGN") {
    return {
      nameLabel: "캠페인명",
      nameValue: wallet.campaignName || "-"
    };
  }

  if (wallet.ownerType === "BENEFICIARY") {
    return {
      nameLabel: "수혜자명",
      nameValue: wallet.foundationName || "-"
    };
  }

  if (wallet.ownerType === "DONOR") {
    return {
      nameLabel: "기부자명",
      nameValue: wallet.foundationName || "-"
    };
  }

  return {
    nameLabel: "이름",
    nameValue: wallet.foundationName || wallet.campaignName || "-"
  };
}

function getEventTypeLabel(eventType) {
  return EVENT_TYPE_LABELS[eventType] || eventType;
}

function getOwnerTypeLabel(ownerType) {
  return OWNER_TYPE_LABELS[ownerType] || "미확인";
}

function getOwnerTypeByLabel(ownerTypeLabel) {
  return OWNER_TYPE_BY_LABEL[String(ownerTypeLabel || "").trim()] || "";
}

function isPolSymbol(value) {
  return String(value || "").trim().toUpperCase() === "POL";
}

function isGasChargeByEventType(eventType, eventTypeLabel) {
  const normalizedType = String(eventType || "").toUpperCase();
  const normalizedLabel = String(eventTypeLabel || "").trim();

  return (
    normalizedType === "GAS_CHARGE" ||
    normalizedType === "GAS_TOPUP" ||
    normalizedType === "GAS_RECHARGE" ||
    normalizedLabel === "가스 충전"
  );
}

function getTransactionAmountUnit(transaction) {
  const explicitUnitCandidates = [
    transaction?.amountUnit,
    transaction?.unit,
    transaction?.currency,
    transaction?.symbol,
    transaction?.tokenSymbol,
    transaction?.assetSymbol,
    transaction?.coinSymbol
  ];

  if (explicitUnitCandidates.some(isPolSymbol)) {
    return "POL";
  }

  return isGasChargeByEventType(transaction?.eventType, transaction?.eventTypeLabel) ? "POL" : "GNT";
}

function resolveFromOwnerType(transaction) {
  return (
    String(transaction?.fromOwnerType || "").toUpperCase() ||
    String(transaction?.fromWallet?.ownerType || "").toUpperCase() ||
    getOwnerTypeByLabel(transaction?.fromOwnerTypeLabel)
  );
}

function resolveToOwnerType(transaction) {
  return (
    String(transaction?.toOwnerType || "").toUpperCase() ||
    String(transaction?.toWallet?.ownerType || "").toUpperCase() ||
    getOwnerTypeByLabel(transaction?.toOwnerTypeLabel)
  );
}

function getDashboardEventTypeLabel(transaction) {
  const eventType = String(transaction?.eventType || "").toUpperCase();
  const amountUnit = getTransactionAmountUnit(transaction);
  const fromOwnerType = resolveFromOwnerType(transaction);
  const toOwnerType = resolveToOwnerType(transaction);

  if (amountUnit === "POL") {
    return "가스 충전";
  }

  if (fromOwnerType === "SERVER" && toOwnerType === "DONOR") {
    return "토큰화";
  }

  if (fromOwnerType === "DONOR" && toOwnerType === "CAMPAIGN") {
    return "기부";
  }

  if (fromOwnerType === "CAMPAIGN" && toOwnerType === "FOUNDATION") {
    return "수수료 지급";
  }

  if (fromOwnerType === "CAMPAIGN" && toOwnerType === "BENEFICIARY") {
    return "기부금 정산";
  }

  if (
    (fromOwnerType === "BENEFICIARY" || fromOwnerType === "FOUNDATION") &&
    (eventType === "CASHOUT" || eventType === "WITHDRAWAL")
  ) {
    return "현금화(출금)";
  }

  return transaction?.eventTypeLabel || getEventTypeLabel(transaction?.eventType);
}

function normalizeWallet(wallet) {
  if (!wallet) {
    return null;
  }

  return {
    ...wallet,
    ownerTypeLabel: wallet.ownerTypeLabel || getOwnerTypeLabel(wallet.ownerType),
    ...getWalletDisplayInfo(wallet)
  };
}

function normalizeTransaction(transaction) {
  if (!transaction) {
    return null;
  }

  const normalizedTxHash =
    transaction.txHash ||
    transaction.transactionHash ||
    transaction.hash ||
    transaction.tx_hash ||
    "";

  return {
    ...transaction,
    amountUnit: getTransactionAmountUnit(transaction),
    eventTypeLabel: getDashboardEventTypeLabel(transaction),
    fromOwnerTypeLabel:
      transaction.fromOwnerTypeLabel ||
      transaction.fromWallet?.ownerTypeLabel ||
      getOwnerTypeLabel(transaction.fromWallet?.ownerType),
    toOwnerTypeLabel:
      transaction.toOwnerTypeLabel ||
      transaction.toWallet?.ownerTypeLabel ||
      getOwnerTypeLabel(transaction.toWallet?.ownerType),
    fromWalletAddress: transaction.fromWalletAddress || transaction.fromWallet?.walletAddress || "",
    toWalletAddress: transaction.toWalletAddress || transaction.toWallet?.walletAddress || ""
  };
}

function normalizeTransactionsResponse(response) {
  return {
    ...response,
    items: (response.items || []).map(normalizeTransaction)
  };
}

function normalizeDashboardPageInfo(pageInfo = {}, requestedPage, requestedPageSize) {
  const totalItems = Number(pageInfo.totalItems || 0);

  return {
    page: requestedPage,
    pageSize: requestedPageSize,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / requestedPageSize))
  };
}

async function requestTransactionsPage({ page, keyword, pageSize }) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(pageSize),
    keyword,
    status: "SUCCESS"
  });

  return normalizeTransactionsResponse(
    await request(`/api/blockchain/transactions?${query.toString()}`)
  );
}

async function requestDonationTransactionsPage({ page, pageSize = 200 }) {
  const query = new URLSearchParams({
    page: String(page),
    size: String(pageSize),
    status: "SUCCESS",
    eventType: "DONATION"
  });

  return normalizeTransactionsResponse(
    await request(`/api/blockchain/transactions?${query.toString()}`)
  );
}

function toBigIntAmount(value) {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value)) {
    return BigInt(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }

  return 0n;
}

async function getDonationTokenAmount() {
  const firstPage = await requestDonationTransactionsPage({ page: 1 });
  const totalPages = Number(firstPage?.pageInfo?.totalPages || 1);
  const safeTotalPages = Math.max(1, Math.min(totalPages, 200));
  let sum = 0n;

  const addDonationAmounts = (items = []) => {
    items.forEach((item) => {
      if (String(item?.eventType || "").toUpperCase() === "DONATION") {
        sum += toBigIntAmount(item?.amount);
      }
    });
  };

  addDonationAmounts(firstPage?.items || []);

  for (let page = 2; page <= safeTotalPages; page += 1) {
    const response = await requestDonationTransactionsPage({ page });
    addDonationAmounts(response?.items || []);
  }

  return sum.toString();
}

async function getServerPaginatedDashboardTransactions({ page, keyword, pageSize }) {
  const firstResponse = await requestTransactionsPage({ page, keyword, pageSize });
  const serverPageSize = Number(firstResponse.pageInfo?.pageSize || 0);

  if (!serverPageSize || serverPageSize >= pageSize) {
    return firstResponse;
  }

  const pagesPerClientPage = Math.ceil(pageSize / serverPageSize);
  const serverStartPage = (page - 1) * pagesPerClientPage + 1;
  const serverPages = Array.from(
    { length: pagesPerClientPage },
    (_, index) => serverStartPage + index
  );

  const responses = await Promise.all(
    serverPages.map((serverPage, index) => {
      if (index === 0) {
        return Promise.resolve(firstResponse);
      }

      return requestTransactionsPage({
        page: serverPage,
        keyword,
        pageSize
      });
    })
  );

  return {
    items: responses.flatMap((response) => response.items || []).slice(0, pageSize),
    pageInfo: normalizeDashboardPageInfo(firstResponse.pageInfo, page, pageSize)
  };
}

function normalizeTransactionDetail(response) {
  const fromWallet = normalizeWallet(response.fromWallet);
  const toWallet = normalizeWallet(response.toWallet);

  return {
    ...normalizeTransaction(response),
    foundationName:
      response.foundationName || fromWallet?.foundationName || toWallet?.foundationName || "-",
    campaignName:
      response.campaignName || fromWallet?.campaignName || toWallet?.campaignName || "-",
    fromWallet,
    toWallet
  };
}

function normalizeWalletDetail(response) {
  return {
    ...response,
    wallet: normalizeWallet(response.wallet),
    items: (response.items || []).map(normalizeTransaction)
  };
}

function getTransactionsCacheKey({
  page = 1,
  keyword = "",
  pageSize = DASHBOARD_PAGE_SIZE
} = {}) {
  return `${TRANSACTIONS_CACHE_PREFIX}:${page}:${pageSize}:${keyword.trim().toLowerCase()}`;
}

function readTransactionsCache(options) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const cached = window.sessionStorage.getItem(getTransactionsCacheKey(options));

    if (!cached) {
      return null;
    }

    const parsed = JSON.parse(cached);

    if (!parsed?.savedAt || !parsed?.data) {
      return null;
    }

    if (Date.now() - parsed.savedAt > TRANSACTIONS_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(getTransactionsCacheKey(options));
      return null;
    }

    if (
      options.pageSize &&
      parsed.data?.pageInfo?.pageSize &&
      parsed.data.pageInfo.pageSize !== options.pageSize
    ) {
      window.sessionStorage.removeItem(getTransactionsCacheKey(options));
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

function writeTransactionsCache(options, data) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      getTransactionsCacheKey(options),
      JSON.stringify({
        savedAt: Date.now(),
        data
      })
    );
  } catch {
    // Ignore storage failures and keep runtime behavior intact.
  }
}

export function getCachedTransactions({
  page = 1,
  keyword = "",
  pageSize = DASHBOARD_PAGE_SIZE
} = {}) {
  return readTransactionsCache({ page, keyword, pageSize });
}

export async function getTransactions({
  page = 1,
  keyword = "",
  pageSize = DASHBOARD_PAGE_SIZE
} = {}) {
  const cacheOptions = { page, keyword, pageSize };
  const normalized = await getServerPaginatedDashboardTransactions({
    page,
    keyword,
    pageSize
  });

  writeTransactionsCache(cacheOptions, normalized);
  return normalized;
}

export async function getDashboardOverview() {
  const summary = await request("/api/blockchain/summary?status=SUCCESS");
  let donationTokenAmount = "0";

  try {
    donationTokenAmount = await getDonationTokenAmount();
  } catch {
    donationTokenAmount = String(
      summary.donationTokenAmount ??
      summary.totalDonationAmount ??
      summary.donationAmount ??
      0
    );
  }

  return {
    latestBlock: summary.latestBlock || 0,
    avgBlockTimeSec: Number(summary.avgBlockTimeSec || 0),
    totalTransactions: summary.totalTx || 0,
    tokenAmount: donationTokenAmount,
    tokenDecimals: Number(summary.tokenDecimals ?? summary.decimals ?? 18)
  };
}

export async function getWalletDetail(walletAddress, { page = 1 } = {}) {
  return normalizeWalletDetail(
    await request(
      `/api/blockchain/wallets/${encodeURIComponent(walletAddress)}?page=${page}&status=SUCCESS`
    )
  );
}

export async function getTransactionDetail(txHash) {
  return normalizeTransactionDetail(
    await request(`/api/blockchain/transactions/${encodeURIComponent(txHash)}?status=SUCCESS`)
  );
}

export async function resolveSearchTarget(keyword) {
  const query = new URLSearchParams({ keyword });
  return request(`/api/blockchain/search/resolve?${query.toString()}`);
}

