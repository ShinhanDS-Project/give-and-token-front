import { transactions, wallets } from "./mockBlockchainData";

const PAGE_SIZE = 5;
const WALLET_DETAIL_PAGE_SIZE = 10;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
const USE_MOCK = (import.meta.env.VITE_USE_MOCK_DATA || "true") === "true";

const OWNER_TYPE_LABELS = {
  FOUNDATION: "재단",
  CAMPAIGN: "캠페인",
  BENEFICIARY: "수혜자",
  SERVER: "서버",
  DONOR: "기부자"
};

const EVENT_TYPE_LABELS = {
  DONATION: "기부",
  SETTLEMENT: "정산",
  TOKENIZATION: "토큰화",
  CASHOUT: "현금화",
  WITHDRAWAL: "현금화"
};

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
      nameLabel: "수혜처명",
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

function paginate(items, page, pageSize = PAGE_SIZE) {
  const currentPage = Math.max(1, Number(page) || 1);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;

  return {
    items: items.slice(startIndex, startIndex + pageSize),
    pageInfo: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages
    }
  };
}

function includesIgnoreCase(value, keyword) {
  return String(value || "").toLowerCase().includes(keyword.toLowerCase());
}

function getWalletByAddress(walletAddress) {
  return wallets.find((item) => item.walletAddress === walletAddress) || null;
}

function getOwnerTypeLabel(walletAddress) {
  return OWNER_TYPE_LABELS[getWalletByAddress(walletAddress)?.ownerType] || "미확인";
}

function getEventTypeLabel(eventType) {
  return EVENT_TYPE_LABELS[eventType] || eventType;
}

function decorateTransaction(transaction) {
  return {
    ...transaction,
    eventTypeLabel: getEventTypeLabel(transaction.eventType),
    fromOwnerTypeLabel: getOwnerTypeLabel(transaction.fromWalletAddress),
    toOwnerTypeLabel: getOwnerTypeLabel(transaction.toWalletAddress)
  };
}

function getSuccessTransactions() {
  return transactions.filter((transaction) => transaction.status === "SUCCESS");
}

function filterTransactions(keyword) {
  const normalized = keyword.trim();
  const successTransactions = getSuccessTransactions();

  if (!normalized) {
    return successTransactions;
  }

  return successTransactions.filter((transaction) => {
    return (
      includesIgnoreCase(transaction.txHash, normalized) ||
      includesIgnoreCase(transaction.foundationName, normalized) ||
      includesIgnoreCase(transaction.campaignName, normalized) ||
      includesIgnoreCase(transaction.fromWalletAddress, normalized) ||
      includesIgnoreCase(transaction.toWalletAddress, normalized)
    );
  });
}

function findWalletByKeyword(keyword) {
  const normalized = keyword.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const exactAddressMatch = wallets.find(
    (wallet) => wallet.walletAddress.toLowerCase() === normalized
  );

  if (exactAddressMatch) {
    return exactAddressMatch;
  }

  const exactFoundationWalletMatch = wallets.find(
    (wallet) =>
      wallet.ownerType === "FOUNDATION" &&
      wallet.foundationName.toLowerCase() === normalized
  );

  if (exactFoundationWalletMatch) {
    return exactFoundationWalletMatch;
  }

  const exactCampaignWalletMatch = wallets.find(
    (wallet) =>
      wallet.ownerType === "CAMPAIGN" &&
      wallet.campaignName.toLowerCase() === normalized
  );

  if (exactCampaignWalletMatch) {
    return exactCampaignWalletMatch;
  }

  return null;
}

function findTransactionByKeyword(keyword) {
  const normalized = keyword.trim().toLowerCase();

  if (!normalized) {
    return null;
  }

  const exactHashMatch = transactions.find(
    (transaction) =>
      transaction.status === "SUCCESS" &&
      transaction.txHash.toLowerCase() === normalized
  );

  if (exactHashMatch) {
    return exactHashMatch;
  }

  return null;
}

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export async function getTransactions({ page = 1, keyword = "" } = {}) {
  if (!USE_MOCK) {
    const query = new URLSearchParams({
      page: String(page),
      keyword,
      status: "SUCCESS"
    });

    return request(`/api/blockchain/transactions?${query.toString()}`);
  }

  const sorted = [...filterTransactions(keyword)]
    .map(decorateTransaction)
    .sort((left, right) => new Date(right.sentAt) - new Date(left.sentAt));

  return paginate(sorted, page);
}

export async function getDashboardOverview() {
  if (!USE_MOCK) {
    return request("/api/blockchain/dashboard/overview?status=SUCCESS");
  }

  const successTransactions = getSuccessTransactions()
    .map(decorateTransaction)
    .sort((left, right) => new Date(right.sentAt) - new Date(left.sentAt));

  const latestBlock = successTransactions.reduce(
    (max, item) => Math.max(max, Number(item.blockNum || 0)),
    0
  );
  const tokenizationItems = successTransactions.filter(
    (item) => item.eventType === "TOKENIZATION"
  );
  const cashoutItems = successTransactions.filter(
    (item) => item.eventType === "CASHOUT" || item.eventType === "WITHDRAWAL"
  );

  return {
    latestBlock,
    totalTransactions: successTransactions.length,
    issuedTokenAmount: tokenizationItems.reduce((sum, item) => sum + item.amount, 0),
    reclaimedTokenAmount: cashoutItems.reduce((sum, item) => sum + item.amount, 0),
    tokenizationCount: tokenizationItems.length,
    cashoutCount: cashoutItems.length
  };
}

export async function getWalletDetail(walletAddress, { page = 1 } = {}) {
  if (!USE_MOCK) {
    return request(
      `/api/blockchain/wallets/${walletAddress}?page=${page}&size=${WALLET_DETAIL_PAGE_SIZE}&status=SUCCESS`
    );
  }

  const wallet = getWalletByAddress(walletAddress);

  if (!wallet) {
    throw new Error("Wallet not found");
  }

  const relatedTransactions = transactions
    .filter(
      (transaction) =>
        transaction.status === "SUCCESS" &&
        (transaction.fromWalletAddress === walletAddress ||
          transaction.toWalletAddress === walletAddress)
    )
    .map(decorateTransaction)
    .sort((left, right) => new Date(right.sentAt) - new Date(left.sentAt));

  return {
    wallet: {
      ...wallet,
      ownerTypeLabel: OWNER_TYPE_LABELS[wallet.ownerType] || wallet.ownerType,
      ...getWalletDisplayInfo(wallet)
    },
    ...paginate(relatedTransactions, page, WALLET_DETAIL_PAGE_SIZE)
  };
}

export async function getTransactionDetail(txHash) {
  if (!USE_MOCK) {
    return request(`/api/blockchain/transactions/${txHash}`);
  }

  const transaction =
    transactions.find((item) => item.txHash === txHash && item.status === "SUCCESS") ||
    null;

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  const fromWallet = getWalletByAddress(transaction.fromWalletAddress);
  const toWallet = getWalletByAddress(transaction.toWalletAddress);

  return {
    ...decorateTransaction(transaction),
    fromWallet,
    toWallet
  };
}

export async function resolveSearchTarget(keyword) {
  if (!USE_MOCK) {
    const query = new URLSearchParams({ keyword });
    return request(`/api/blockchain/search/resolve?${query.toString()}`);
  }

  const transaction = findTransactionByKeyword(keyword);

  if (transaction) {
    return {
      type: "transaction",
      value: transaction.txHash
    };
  }

  const wallet = findWalletByKeyword(keyword);

  if (wallet) {
    return {
      type: "wallet",
      value: wallet.walletAddress
    };
  }

  return {
    type: "not_found",
    value: null
  };
}
