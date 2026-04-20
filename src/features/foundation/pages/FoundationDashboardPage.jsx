import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bell,
  Building2,
  Camera,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  FileClock,
  House,
  Layers,
  LogOut,
  Settings,
  Wallet,
  Pencil,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import NotificationBell from "../../donation/components/NotificationBell";  //[가빈] 알림벨 추가
import "../css/FoundationDashboardPage.css";
import {
  fetchFoundationMyInfo,
  fetchFoundationMyStats,
  fetchCampaignDetail,
  fetchCampaignDetailPublic,
  fetchPendingCampaignEditDetail,
  fetchFoundationRecentCampaigns,
  fetchFoundationWalletInfo,
  fetchFoundationSettlements,
  fetchFoundationRedemptions,
  getFoundationNoFromAccessToken,
  logoutFoundationAccount,
  requestFoundationRedemption,
  updateFoundationPassword,
  updateFoundationMyInfo,
} from "../api/foundationApi";

const BRAND_COLOR = "#FF8A65";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

function formatWon(value) {
  return Number(value || 0).toLocaleString("ko-KR");
}

function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("ko-KR");
}

function toImageSrc(path) {
  if (!path) {
    return "";
  }

  const rawPath = String(path).trim();
  if (!rawPath) return "";
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(rawPath)) return rawPath;

  const noFileScheme = rawPath.replace(/^file:(\/\/\/|\/\/)?/i, "");
  const normalized = noFileScheme.replace(/\\/g, "/");
  const uploadMatch = normalized.match(/(?:^|\/)uploads\/(.+)$/i);
  if (uploadMatch) {
    const uploadPath = `/uploads/${uploadMatch[1].replace(/^\/+/, "")}`;
    return API_BASE_URL ? `${API_BASE_URL}${uploadPath}` : uploadPath;
  }

  if (/^[a-zA-Z]:\//.test(normalized)) return "";
  if (!API_BASE_URL) return rawPath;
  return rawPath.startsWith("/") ? `${API_BASE_URL}${rawPath}` : `${API_BASE_URL}/${rawPath}`;
}

function normalizeCampaignDetail(detail, fallbackCampaign) {
  const safeDetail = detail || {};
  const imagesFromSummary = Array.isArray(safeDetail.images)
    ? safeDetail.images.map((item) => item?.imgPath || item?.imagePath || item?.path || "")
    : [];
  const detailImages = Array.isArray(safeDetail.detailImagePaths)
    ? safeDetail.detailImagePaths
    : Array.isArray(safeDetail.detailImages)
      ? safeDetail.detailImages.map((item) =>
          typeof item === "string"
            ? item
            : item?.imagePath || item?.path || item?.url || "",
        )
      : imagesFromSummary.length > 0
        ? imagesFromSummary
      : [];

  return {
    ...fallbackCampaign,
    ...safeDetail,
    title: safeDetail.title || safeDetail.campaignTitle || fallbackCampaign?.title || "",
    description:
      safeDetail.description ||
      safeDetail.historyDescription ||
      safeDetail.content ||
      fallbackCampaign?.description ||
      "",
    representativeImagePath:
      safeDetail.representativeImagePath ||
      safeDetail.imagePath ||
      safeDetail.thumbnailPath ||
      safeDetail.mainImagePath ||
      fallbackCampaign?.imagePath ||
      fallbackCampaign?.representativeImagePath ||
      "",
    detailImagePaths: detailImages.filter(Boolean),
    rejectReason:
      safeDetail.rejectReason ||
      safeDetail.rejectionReason ||
      fallbackCampaign?.rejectReason ||
      "",
    campaignStatus:
      safeDetail.campaignStatus || safeDetail.status || fallbackCampaign?.campaignStatus,
    approvalStatus:
      safeDetail.approvalStatus || safeDetail.reviewStatus || fallbackCampaign?.approvalStatus,
  };
}

function mergeCampaignDetailSources(sources, fallbackCampaign) {
  const validSources = (sources || []).filter(Boolean);
  const merged = validSources.reduce((acc, item) => ({ ...acc, ...item }), {});
  const mergedDetailImages = validSources.flatMap((item) => {
    if (Array.isArray(item?.detailImagePaths)) return item.detailImagePaths;
    if (Array.isArray(item?.detailImages)) {
      return item.detailImages.map((image) =>
        typeof image === "string"
          ? image
          : image?.imagePath || image?.path || image?.url || "",
      );
    }
    return [];
  }).filter(Boolean);

  return normalizeCampaignDetail(
    {
      ...merged,
      detailImagePaths:
        mergedDetailImages.length > 0
          ? Array.from(new Set(mergedDetailImages))
          : merged.detailImagePaths,
    },
    fallbackCampaign,
  );
}

function formatStatusLabel(value) {
  const status = String(value || "").toUpperCase();
  const statusMap = {
    PENDING: "심사중",
    APPROVED: "승인",
    REJECTED: "반려",
    RECRUITING: "모집중",
    ACTIVE: "진행중",
    ENDED: "종료",
    SETTLED: "정산완료",
    COMPLETED: "완료",
    CANCELLED: "취소",
    PROCESSING: "처리중",
    ONCHAIN_CONFIRMED: "체인확인",
    CASH_PAID: "현금지급완료",
    FAILED: "실패",
  };
  return statusMap[status] || value || "-";
}

const CAMPAIGN_FILTERS = [
  { key: "all", label: "전체" },
  { key: "review", label: "심사중" },
  { key: "active", label: "진행중" },
  { key: "reject", label: "반려" },
  { key: "done", label: "완료" },
];

function isMatchCampaignFilter(campaign, filterKey) {
  const approval = String(campaign?.approvalStatus || "").toUpperCase();
  const status = String(campaign?.campaignStatus || "").toUpperCase();

  if (filterKey === "all") {
    return true;
  }

  if (filterKey === "review") {
    return approval === "PENDING" || status === "PENDING";
  }

  if (filterKey === "active") {
    return status === "RECRUITING" || status === "ACTIVE";
  }

  if (filterKey === "reject") {
    return approval === "REJECTED" || status === "CANCELLED";
  }

  if (filterKey === "done") {
    return status === "ENDED" || status === "SETTLED" || status === "COMPLETED";
  }

  return true;
}

function NotificationPanel({ token }) {
  const [notifications, setNotifications] = useState([]);
  const [loadingNotif, setLoadingNotif] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifs = async (p = 0) => {
    if (!token) { setLoadingNotif(false); return; }
    try {
      setLoadingNotif(true);
      const res = await fetch(`/api/notifications?page=${p}&size=20&sort=created_at,desc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.content ?? []);
        setTotalPages(data.totalPages ?? 0);
      }
    } catch {} finally { setLoadingNotif(false); }
  };

  useEffect(() => { fetchNotifs(page); }, [page, token]);

  const markAsRead = async (no) => {
    try {
      await fetch(`/api/notifications/${no}/read`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      setNotifications((prev) => prev.map((n) => n.notificationNo === no ? { ...n, read: true } : n));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await fetch("/api/notifications/read-all", { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {} finally { setMarkingAll(false); }
  };

  return (
    <div className="fd-panel fd-panel--notification">
      <div className="fd-panel__header" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#1a202c" }}>알림</h2>
        <button
          type="button"
          onClick={markAllAsRead}
          disabled={markingAll}
          className="fd-panel-action-btn fd-panel-action-btn--outline"
          style={{ fontSize: 13 }}
        >
          전체 읽음
        </button>
      </div>

      {loadingNotif ? (
        <div className="fd-empty">알림을 불러오는 중...</div>
      ) : notifications.length === 0 ? (
        <div className="fd-empty">알림이 없습니다.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifications.map((n) => (
            <div
              key={n.notificationNo}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "14px 16px",
                borderRadius: 10,
                border: `1px solid ${n.read ? "#e8ecf2" : "#ffd6c8"}`,
                background: n.read ? "#fff" : "#fff8f5",
                opacity: n.read ? 0.75 : 1,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: n.read ? "#d1d5db" : "#FF8A65", flexShrink: 0, marginTop: 5 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, color: "#1a202c", margin: "0 0 5px", lineHeight: 1.6 }}>{n.content}</p>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{n.createdAt ? new Date(Array.isArray(n.createdAt) ? new Date(n.createdAt[0], n.createdAt[1]-1, n.createdAt[2], n.createdAt[3]??0, n.createdAt[4]??0) : n.createdAt).toLocaleString("ko-KR") : ""}</span>
              </div>
              {!n.read && (
                <button
                  type="button"
                  onClick={() => markAsRead(n.notificationNo)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#FF8A65", fontWeight: 700, flexShrink: 0 }}
                >
                  읽음
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 }}>
          <button type="button" className="fd-btn-secondary" disabled={page <= 0} onClick={() => setPage((p) => p - 1)} style={{ padding: "6px 14px", fontSize: 13 }}>이전</button>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{page + 1} / {totalPages}</span>
          <button type="button" className="fd-btn-secondary" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} style={{ padding: "6px 14px", fontSize: 13 }}>다음</button>
        </div>
      )}
    </div>
  );
}

function FoundationDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeMenu, setActiveMenu] = useState(
    searchParams.get("menu") || "home",
  );
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [foundation, setFoundation] = useState(null);
  const [stats, setStats] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignNo, setSelectedCampaignNo] = useState(() => {
    const raw = Number(searchParams.get("campaignNo"));
    return Number.isFinite(raw) && raw > 0 ? raw : null;
  });
  const [campaignDetail, setCampaignDetail] = useState(null);
  const [campaignDetailLoading, setCampaignDetailLoading] = useState(false);
  const [campaignDetailError, setCampaignDetailError] = useState("");
  const [settingsForm, setSettingsForm] = useState({
    description: "",
    contactPhone: "",
    account: "",
    bankName: "",
    feeRate: "0",
    profileImageFile: null,
  });
  const [settingsInitialized, setSettingsInitialized] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");
  const [settingsEditMode, setSettingsEditMode] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [walletInfo, setWalletInfo] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [settlementError, setSettlementError] = useState("");
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redemptionMessage, setRedemptionMessage] = useState("");
  const [redemptionError, setRedemptionError] = useState("");
  const [isProfileImagePreviewOpen, setIsProfileImagePreviewOpen] = useState(false);

  useEffect(() => {
    const menu = searchParams.get("menu");
    const campaignNo = Number(searchParams.get("campaignNo"));

    setActiveMenu(menu || "home");
    setSelectedCampaignNo(
      Number.isFinite(campaignNo) && campaignNo > 0 ? campaignNo : null,
    );
  }, [searchParams]);

  const updateDashboardSearchParams = (nextMenu, nextCampaignNo = null) => {
    const next = new URLSearchParams(searchParams);
    if (nextMenu) {
      next.set("menu", nextMenu);
    } else {
      next.delete("menu");
    }

    if (nextCampaignNo) {
      next.set("campaignNo", String(nextCampaignNo));
    } else {
      next.delete("campaignNo");
    }

    setSearchParams(next, { replace: true });
  };

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setErrorMessage("");

        const [foundationInfo, foundationStats, campaignPage] =
          await Promise.all([
            fetchFoundationMyInfo(),
            fetchFoundationMyStats(),
            fetchFoundationRecentCampaigns({ size: 500 }),
          ]);

        if (!mounted) {
          return;
        }

        setFoundation(foundationInfo);
        setStats(foundationStats);
        setCampaigns(campaignPage?.content || []);

        // 지갑·정산·현금화 정보 비동기 로드 (홈 대시보드 표시용)
        try {
          const foundationNo = getFoundationNoFromAccessToken() || foundationInfo?.foundationNo;
          const [wallet, settlementPage, redemptionPage] = await Promise.all([
            foundationNo ? fetchFoundationWalletInfo(foundationNo) : Promise.resolve(null),
            fetchFoundationSettlements({ page: 0, size: 2 }),
            fetchFoundationRedemptions({ page: 0, size: 2 }),
          ]);
          if (mounted) {
            if (wallet) setWalletInfo(wallet);
            setSettlements(settlementPage?.content || []);
            setRedemptions(redemptionPage?.content || []);
          }
        } catch {
          // 부가 정보 없어도 대시보드 정상 표시
        }
      } catch (error) {
        if (!mounted) {
          return;
        }

        setErrorMessage(
          error.message || "대시보드 정보를 불러오지 못했습니다.",
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!foundation || settingsInitialized) {
      return;
    }

    setSettingsForm((previous) => ({
      ...previous,
      description: foundation.description || "",
      contactPhone: foundation.contactPhone || "",
      account: foundation.account || "",
      bankName: foundation.bankName || "",
      feeRate:
        foundation.feeRate !== undefined && foundation.feeRate !== null
          ? String(foundation.feeRate)
          : previous.feeRate,
      profileImageFile: null,
    }));
    setSettingsInitialized(true);
  }, [foundation, settingsInitialized]);

  const summary = useMemo(
    () => {
      const activeCampaignsFromList = campaigns.filter((campaign) =>
        isMatchCampaignFilter(campaign, "active"),
      ).length;
      const statsActiveCount = Number(stats?.activeCampaignCount ?? 0);
      const monthlyAmount =
        stats?.thisMonthDonationAmount ??
        stats?.monthlyDonationAmount ??
        stats?.thisMonthAmount ??
        0;

      return {
        foundationName: foundation?.foundationName || "단체명",
        activeCount: Math.max(statsActiveCount, activeCampaignsFromList),
        monthlyAmount,
      };
    },
    [campaigns, foundation, stats],
  );

  const recentCampaigns = useMemo(() => campaigns.slice(0, 2), [campaigns]);
  const settingsProfileImageSrc = useMemo(
    () => toImageSrc(foundation?.profilePath || ""),
    [foundation?.profilePath],
  );

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((campaign) =>
        isMatchCampaignFilter(campaign, campaignFilter),
      ),
    [campaignFilter, campaigns],
  );
  const selectedCampaignFromList = useMemo(
    () => campaigns.find((item) => item.campaignNo === selectedCampaignNo) || null,
    [campaigns, selectedCampaignNo],
  );
  const campaignDetailForView = useMemo(
    () => mergeCampaignDetailSources([campaignDetail], selectedCampaignFromList),
    [campaignDetail, selectedCampaignFromList],
  );

  const canEditPendingCampaign = useMemo(() => {
    const approval = String(campaignDetailForView?.approvalStatus || "").toUpperCase();
    const status = String(campaignDetailForView?.campaignStatus || "").toUpperCase();
    return approval === "PENDING" && status === "PENDING";
  }, [campaignDetailForView]);

  const isRejectedCampaignDetail = useMemo(() => {
    const approval = String(
      campaignDetailForView?.approvalStatus || "",
    ).toUpperCase();
    const status = String(
      campaignDetailForView?.campaignStatus || "",
    ).toUpperCase();
    return approval === "REJECTED" || status === "REJECTED" || status === "CANCELLED";
  }, [campaignDetailForView]);

  const campaignRejectReason = useMemo(
    () =>
      campaignDetailForView?.rejectReason ||
      campaignDetailForView?.rejectionReason ||
      "",
    [campaignDetailForView],
  );

  const isPendingCampaign = (campaign) => {
    const approval = String(campaign?.approvalStatus || "").toUpperCase();
    const status = String(campaign?.campaignStatus || "").toUpperCase();
    return approval === "PENDING" && status === "PENDING";
  };

  const handleOpenCampaignDetail = async (campaign, options = {}) => {
    const campaignNo = campaign?.campaignNo || options.campaignNo;
    if (!campaignNo) {
      return;
    }

    try {
      setCampaignDetailLoading(true);
      setCampaignDetailError("");
      setCampaignDetail(null);
      setSelectedCampaignNo(campaignNo);
      setActiveMenu("campaign");
      const shouldSyncUrl = options.syncUrl !== false;
      if (shouldSyncUrl) {
        const currentCampaignNo = Number(searchParams.get("campaignNo"));
        const currentMenu = searchParams.get("menu") || "home";
        if (currentMenu !== "campaign" || currentCampaignNo !== campaignNo) {
          updateDashboardSearchParams("campaign", campaignNo);
        }
      }

      const isPendingHint = campaign ? isPendingCampaign(campaign) : false;
      const detailCandidates = [];

      if (isPendingHint) {
        try {
          detailCandidates.push(await fetchPendingCampaignEditDetail(campaignNo));
        } catch {
          // keep going
        }
      }

      try {
        detailCandidates.push(await fetchCampaignDetail(campaignNo));
      } catch {
        // keep going
      }

      try {
        detailCandidates.push(await fetchPendingCampaignEditDetail(campaignNo));
      } catch {
        // keep going
      }

      try {
        detailCandidates.push(await fetchCampaignDetailPublic(campaignNo));
      } catch {
        // keep going
      }

      if (detailCandidates.length === 0 && !campaign) {
        throw new Error("캠페인 상세를 불러오지 못했습니다.");
      }

      setCampaignDetail(mergeCampaignDetailSources(detailCandidates, campaign));
    } catch (error) {
      setCampaignDetailError(
        error.message || "캠페인 상세를 불러오지 못했습니다.",
      );
    } finally {
      setCampaignDetailLoading(false);
    }
  };

  const handleBackToCampaignList = () => {
    setSelectedCampaignNo(null);
    setCampaignDetail(null);
    setCampaignDetailError("");
    updateDashboardSearchParams("campaign");
  };

  const handleOpenMenu = (menuKey) => {
    setActiveMenu(menuKey);
    updateDashboardSearchParams(menuKey);
  };

  const handleGoHome = () => {
    navigate("/foundation/me");
  };

  const handleLogout = async () => {
    try {
      await logoutFoundationAccount();
    } finally {
      navigate("/", { replace: true });
    }
  };

  const handleSettingsChange = (event) => {
    const { name, value } = event.target;
    setSettingsForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    setSettingsError("");
    setSettingsMessage("");
  };

  const handleSettingsImageChange = (event) => {
    const nextFile = event.target.files?.[0] ?? null;
    setSettingsForm((previous) => ({
      ...previous,
      profileImageFile: nextFile,
    }));
    setSettingsError("");
    setSettingsMessage("");
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({
      ...previous,
      [name]: value,
    }));
    setSettingsError("");
    setSettingsMessage("");
  };

  const handleSettingsSubmit = async (event) => {
    event.preventDefault();
    if (!settingsEditMode) return;

    const feeRateNumber = Number(settingsForm.feeRate);
    if (
      !settingsForm.description.trim() ||
      !settingsForm.contactPhone.trim() ||
      !settingsForm.account.trim() ||
      !settingsForm.bankName.trim()
    ) {
      setSettingsError("모든 필수 항목을 입력해주세요.");
      return;
    }

    if (Number.isNaN(feeRateNumber) || feeRateNumber < 0 || feeRateNumber > 1) {
      setSettingsError("수수료율은 0~1 사이 숫자로 입력해주세요.");
      return;
    }

    const shouldUpdatePassword =
      passwordForm.currentPassword.trim() ||
      passwordForm.newPassword.trim() ||
      passwordForm.confirmPassword.trim();

    if (shouldUpdatePassword) {
      if (
        !passwordForm.currentPassword.trim() ||
        !passwordForm.newPassword.trim() ||
        !passwordForm.confirmPassword.trim()
      ) {
        setSettingsError("비밀번호 변경 항목을 모두 입력해주세요.");
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setSettingsError("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        return;
      }
    }

    try {
      setSettingsSaving(true);
      setSettingsError("");
      setSettingsMessage("");

      const updated = await updateFoundationMyInfo(settingsForm);
      setFoundation((previous) => ({
        ...previous,
        ...updated,
        bankName: settingsForm.bankName,
        feeRate: Number(settingsForm.feeRate),
      }));
      setSettingsForm((previous) => ({
        ...previous,
        description: updated.description ?? previous.description,
        contactPhone: updated.contactPhone ?? previous.contactPhone,
        account: updated.account ?? previous.account,
        bankName: updated.bankName ?? previous.bankName,
        feeRate:
          updated.feeRate !== undefined && updated.feeRate !== null
            ? String(updated.feeRate)
            : previous.feeRate,
        profileImageFile: null,
      }));

      if (shouldUpdatePassword) {
        await updateFoundationPassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        });
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setSettingsEditMode(false);
      setSettingsMessage(
        shouldUpdatePassword
          ? "기부단체 정보와 비밀번호가 저장되었습니다."
          : "기부단체 정보가 저장되었습니다.",
      );
    } catch (error) {
      setSettingsError(error.message || "기부단체 정보 수정에 실패했습니다.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleStartSettingsEdit = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setSettingsMessage("");
    setSettingsError("");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setTimeout(() => setSettingsEditMode(true), 0);
  };

  const handleCancelSettingsEdit = () => {
    setSettingsForm((previous) => ({
      ...previous,
      description: foundation?.description || "",
      contactPhone: foundation?.contactPhone || "",
      account: foundation?.account || "",
      bankName: foundation?.bankName || "",
      feeRate:
        foundation?.feeRate !== undefined && foundation?.feeRate !== null
          ? String(foundation.feeRate)
          : "0",
      profileImageFile: null,
    }));
    setSettingsEditMode(false);
    setSettingsError("");
    setSettingsMessage("");
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const loadSettlementData = async () => {
    const foundationNoFromToken = getFoundationNoFromAccessToken();
    const foundationNo = foundationNoFromToken || foundation?.foundationNo;

    if (!foundationNo) {
      setSettlementError("기부단체 번호를 확인할 수 없습니다. 다시 로그인해주세요.");
      return;
    }

    try {
      setSettlementLoading(true);
      setSettlementError("");

      const [wallet, settlementPage, redemptionPage] = await Promise.all([
        fetchFoundationWalletInfo(foundationNo),
        fetchFoundationSettlements({ page: 0, size: 20 }),
        fetchFoundationRedemptions({ page: 0, size: 20 }),
      ]);

      setWalletInfo(wallet);
      setSettlements(settlementPage?.content || []);
      setRedemptions(redemptionPage?.content || []);
    } catch (error) {
      setSettlementError(error.message || "정산 정보를 불러오지 못했습니다.");
    } finally {
      setSettlementLoading(false);
    }
  };

  const handleRedemptionSubmit = async () => {
    const foundationNoFromToken = getFoundationNoFromAccessToken();
    const foundationNo = foundationNoFromToken || foundation?.foundationNo;
    const amount = Number(redemptionAmount);

    if (!foundationNo) {
      setRedemptionError("기부단체 번호를 확인할 수 없습니다.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setRedemptionError("현금화 금액을 1 이상으로 입력해주세요.");
      return;
    }

    try {
      setRedeeming(true);
      setRedemptionError("");
      setRedemptionMessage("");

      await requestFoundationRedemption({
        requesterNo: foundationNo,
        amount,
      });

      setRedemptionMessage("현금화 신청이 접수되었습니다.");
      setRedemptionAmount("");
      await loadSettlementData();
    } catch (error) {
      setRedemptionError(error.message || "현금화 신청에 실패했습니다.");
    } finally {
      setRedeeming(false);
    }
  };

  useEffect(() => {
    if (loading || activeMenu !== "campaign" || !selectedCampaignNo) {
      return;
    }

    const campaign = campaigns.find((item) => item.campaignNo === selectedCampaignNo);
    handleOpenCampaignDetail(campaign || { campaignNo: selectedCampaignNo }, { syncUrl: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, activeMenu, selectedCampaignNo, campaigns]);

  useEffect(() => {
    if (activeMenu !== "settlement") {
      return;
    }
    loadSettlementData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeMenu, foundation?.foundationNo]);

  useEffect(() => {
    if (activeMenu !== "home") {
      return;
    }

    const foundationNoFromToken = getFoundationNoFromAccessToken();
    const foundationNo = foundationNoFromToken || foundation?.foundationNo;
    if (!foundationNo) {
      return;
    }

    let ignore = false;
    (async () => {
      try {
        const wallet = await fetchFoundationWalletInfo(foundationNo);
        if (!ignore) {
          setWalletInfo(wallet);
        }
      } catch {
        // keep previous wallet info on transient errors
      }
    })();

    return () => {
      ignore = true;
    };
  }, [activeMenu, foundation?.foundationNo]);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const prevRootOverflow = root.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      root.style.overflow = prevRootOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "40px", fontSize: "14px", color: "#64748b", fontFamily: "'Nanum Gothic', sans-serif" }}>
        불러오는 중...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div style={{ padding: "40px", fontFamily: "'Nanum Gothic', sans-serif" }}>
        <div className="fd-panel" style={{ maxWidth: 480 }}>
          <p className="fd-error-text">{errorMessage}</p>
          <button type="button" className="fd-btn-primary" style={{ marginTop: 12 }} onClick={() => navigate("/login")}>
            로그인으로 이동
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fd-page${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>

      {/* ── 사이드바 래퍼 ── */}
      <div className="fd-sidebar-wrapper" style={{ position: "relative" }}>
        <aside className="fd-sidebar">
          <div className="fd-sidebar__brand">
            <div className="fd-sidebar__brand-logo">
              {foundation?.profilePath ? (
                <img
                  src={toImageSrc(foundation.profilePath)}
                  alt="기부단체 로고"
                  className="fd-sidebar__brand-logo-img"
                />
              ) : (
                "g"
              )}
            </div>
            <div className="fd-sidebar__brand-info">
              <span className="fd-sidebar__brand-name">{summary.foundationName}</span>
              <span className="fd-sidebar__brand-sub">기부단체 콘솔</span>
            </div>
            <div className="fd-notif-wrap">
              <NotificationBell userRole="foundation" dropPosition="left" onViewAll={() => handleOpenMenu("notification")} />
            </div>
          </div>

          <nav className="fd-sidebar__nav">
            <button type="button" className={`fd-nav-btn ${activeMenu === "home" ? "is-active" : ""}`} onClick={handleGoHome} title="홈">
              <House size={14} /><span>홈</span>
            </button>
            <button type="button" className={`fd-nav-btn ${activeMenu === "campaign" ? "is-active" : ""}`} onClick={() => handleOpenMenu("campaign")} title="캠페인">
              <Layers size={14} /><span>캠페인</span>
            </button>
            <button type="button" className={`fd-nav-btn ${activeMenu === "settlement" ? "is-active" : ""}`} onClick={() => handleOpenMenu("settlement")} title="정산">
              <Wallet size={14} /><span>정산</span>
            </button>
            <button type="button" className={`fd-nav-btn ${activeMenu === "settings" ? "is-active" : ""}`} onClick={() => handleOpenMenu("settings")} title="정보관리">
              <Settings size={14} /><span>정보관리</span>
            </button>
            <button type="button" className={`fd-nav-btn ${activeMenu === "notification" ? "is-active" : ""}`} onClick={() => handleOpenMenu("notification")} title="알림 내역">
              <Bell size={14} /><span>알림 내역</span>
            </button>
          </nav>

          <div className="fd-sidebar__bottom">
            <a href="http://localhost:5173/" className="fd-sidebar__bottom-link" title="기부엔토큰 바로가기">
              <House size={13} /><span className="fd-sidebar__bottom-text">기부엔토큰 바로가기</span>
            </a>
            <button type="button" className="fd-sidebar__bottom-btn" onClick={handleLogout} title="로그아웃">
              <LogOut size={13} /><span className="fd-sidebar__bottom-text">로그아웃</span>
            </button>
          </div>
        </aside>

        {/* 토글 버튼 */}
        <button
          type="button"
          className="fd-collapse-btn"
          onClick={() => setSidebarCollapsed((p) => !p)}
          title={sidebarCollapsed ? "사이드바 펼치기" : "사이드바 접기"}
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

        {/* ── 메인 콘텐츠 ── */}
        <div className="fd-main">
          <header className="fd-main-header">
            <h1>기부단체 마이페이지</h1>
          </header>

          {/* 홈 */}
          {activeMenu === "home" && (
            <div className="fd-home-layout">
              {/* 왼쪽: 프로필 카드 + 스탯 + 퀵액션 */}
              <div className="fd-home-left">
                <div className="fd-profile-card">
                  <div className="fd-profile-card__img-wrap">
                    {foundation?.profilePath ? (
                      <img src={toImageSrc(foundation.profilePath)} alt="기부단체 프로필" />
                    ) : (
                      <div className="fd-profile-card__img-placeholder">
                        {(summary.foundationName || "?")[0]}
                      </div>
                    )}
                    <div className="fd-profile-card__overlay">
                      <p className="fd-profile-card__greeting">반갑습니다</p>
                      <p className="fd-profile-card__name">{summary.foundationName}</p>
                      <p className="fd-profile-card__type">{foundation?.foundationType || foundation?.category || "기부단체"}</p>
                    </div>
                  </div>
                </div>

                <div className="fd-stats-grid">
                  <div className="fd-stat-card">
                    <p className="fd-stat-card__label">진행 중인 캠페인</p>
                    <p className="fd-stat-card__value">
                      {summary.activeCount}<span className="fd-stat-card__unit">개</span>
                    </p>
                  </div>
                  <div className="fd-stat-card">
                    <p className="fd-stat-card__label">이달 모금 금액</p>
                    <p className="fd-stat-card__value" style={{ fontSize: 16 }}>
                      {formatWon(summary.monthlyAmount)}<span className="fd-stat-card__unit">원</span>
                    </p>
                  </div>
                  <div className="fd-stat-card">
                    <p className="fd-stat-card__label">지갑 잔액</p>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
                      <p className="fd-stat-card__value" style={{ fontSize: 16, margin: 0 }}>
                        {walletInfo?.balance !== undefined && walletInfo?.balance !== null ? formatWon(walletInfo.balance) : "-"}
                        <span className="fd-stat-card__unit">GNT</span>
                      </p>
                      <p className="fd-stat-card__addr">{walletInfo?.walletAddress ? `${walletInfo.walletAddress.slice(0, 8)}...${walletInfo.walletAddress.slice(-6)}` : "-"}</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* 오른쪽: 퀵액션 + 최근 신청 현황 */}
              <div className="fd-panel fd-home-right">
                <div className="fd-quick-actions" style={{ marginBottom: 16 }}>
                  <button type="button" className="fd-quick-btn" onClick={() => navigate("/foundation/register")}>
                    <CirclePlus size={18} color="#FF8A65" />
                    <div>
                      <p className="fd-quick-btn__title">새 캠페인 신청</p>
                      <p className="fd-quick-btn__desc">새로운 캠페인을 등록하세요</p>
                    </div>
                  </button>
                  <button type="button" className="fd-quick-btn" onClick={() => handleOpenMenu("campaign")}>
                    <FileClock size={18} color="#f59e0b" />
                    <div>
                      <p className="fd-quick-btn__title">신청 목록 조회</p>
                      <p className="fd-quick-btn__desc">진행 상태를 확인하세요</p>
                    </div>
                  </button>
                </div>

                <div className="fd-panel__header" style={{ marginBottom: 10 }}>
                  <h3 className="fd-panel__title">최근 신청 현황</h3>
                  <button type="button" className="fd-panel__link" onClick={() => handleOpenMenu("campaign")}>전체보기</button>
                </div>

                {recentCampaigns.length === 0 ? (
                  <div className="fd-empty">최근 신청한 캠페인이 없습니다.</div>
                ) : (
                  recentCampaigns.map((campaign) => (
                    <article
                      key={campaign.campaignNo}
                      className="fd-campaign-item"
                      onClick={() => { handleOpenMenu("campaign"); handleOpenCampaignDetail(campaign); }}
                    >
                      <div className="fd-campaign-item__meta">
                        <span className="fd-badge">{formatStatusLabel(campaign.approvalStatus) || "-"}</span>
                        <span className="fd-campaign-item__date">{campaign.createdAt?.slice?.(0, 10) || "-"}</span>
                      </div>
                      <p className="fd-campaign-item__title">{campaign.title}</p>
                      <div className="fd-progress-wrap">
                        <div className="fd-progress-info">
                          <span style={{ color: "#FF8A65", fontWeight: 800 }}>{campaign.progressPercent ?? 0}%</span>
                          <span>{formatWon(campaign.currentAmount)} / {formatWon(campaign.targetAmount)}원</span>
                        </div>
                        <div className="fd-progress-bar">
                          <div className="fd-progress-bar__fill" style={{ width: `${Math.max(0, Math.min(100, campaign.progressPercent ?? 0))}%` }} />
                        </div>
                      </div>
                    </article>
                  ))
                )}

                {/* 최근 정산 내역 */}
                <div className="fd-panel__header" style={{ marginTop: 32, marginBottom: 10 }}>
                  <h3 className="fd-panel__title">최근 정산 내역</h3>
                  <button type="button" className="fd-panel__link" onClick={() => handleOpenMenu("settlement")}>전체보기</button>
                </div>
                {settlements.length === 0 ? (
                  <div className="fd-empty">정산 내역이 없습니다.</div>
                ) : (
                  <div className="fd-mini-table">
                    <div className="fd-mini-table__head">
                      <span>캠페인명</span>
                      <span style={{ textAlign: "right" }}>단체 배정금</span>
                      <span>상태</span>
                    </div>
                    {settlements.slice(0, 2).map((item) => (
                      <div key={item.settlementNo} className="fd-mini-table__row">
                        <span className="fd-mini-table__name">{item.campaignTitle || "-"}</span>
                        <span className="fd-mini-table__value">{formatWon(item.foundationAmount)}원</span>
                        <span className="fd-badge">{formatStatusLabel(item.status)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 최근 현금화 내역 */}
                <div className="fd-panel__header" style={{ marginTop: 32, marginBottom: 10 }}>
                  <h3 className="fd-panel__title">최근 현금화 내역</h3>
                  <button type="button" className="fd-panel__link" onClick={() => handleOpenMenu("settlement")}>전체보기</button>
                </div>
                {redemptions.length === 0 ? (
                  <div className="fd-empty">현금화 내역이 없습니다.</div>
                ) : (
                  <div className="fd-mini-table">
                    <div className="fd-mini-table__head">
                      <span>신청일</span>
                      <span style={{ textAlign: "right" }}>금액</span>
                      <span>상태</span>
                    </div>
                    {redemptions.slice(0, 2).map((item) => (
                      <div key={item.redemptionNo} className="fd-mini-table__row">
                        <span className="fd-mini-table__name">{item.requestedAt ? new Date(item.requestedAt).toLocaleDateString("ko-KR") : "-"}</span>
                        <span className="fd-mini-table__value">{formatWon(item.amount)}원</span>
                        <span className="fd-badge">{formatStatusLabel(item.status)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 캠페인 */}
          {activeMenu === "campaign" && (
            <div className="fd-panel fd-panel--campaign">
              {selectedCampaignNo ? (
                <>
                  <div className="fd-campaign-detail__toolbar">
                    <button type="button" className="fd-back-btn" onClick={handleBackToCampaignList}>
                      <ArrowLeft size={14} /> 목록으로
                    </button>
                    {canEditPendingCampaign && (
                      <button type="button" className="fd-panel-action-btn" onClick={() => navigate(`/foundation/register?editCampaignNo=${selectedCampaignNo}`)}>
                        <Pencil size={13} /> 심사중 수정
                      </button>
                    )}
                  </div>

                  {campaignDetailLoading && <p style={{ fontSize: 13, color: "#94a3b8" }}>상세 불러오는 중...</p>}
                  {campaignDetailError && !campaignDetailForView && <p className="fd-error-text">{campaignDetailError}</p>}

                  {campaignDetailForView && (
                    <div className="fd-campaign-detail">
                      {isRejectedCampaignDetail && (
                        <p className="fd-error-text" style={{ marginBottom: 12 }}>반려 사유: {campaignRejectReason || "반려 사유가 등록되지 않았습니다."}</p>
                      )}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <h3 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: "#1a202c" }}>{campaignDetailForView.title}</h3>
                        <span className="fd-badge">{formatStatusLabel(campaignDetailForView.campaignStatus || campaignDetailForView.approvalStatus)}</span>
                      </div>

                      {campaignDetailForView.representativeImagePath && (
                        <div style={{ borderRadius: 10, overflow: "hidden", marginBottom: 16, border: "1px solid #e2e8f0" }}>
                          <img src={toImageSrc(campaignDetailForView.representativeImagePath)} alt={campaignDetailForView.title} style={{ width: "100%", height: 240, objectFit: "cover", display: "block" }} />
                        </div>
                      )}

                      <p className="fd-section-header">상세 설명</p>
                      <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.7, marginBottom: 16 }}>{campaignDetailForView.description || "-"}</p>

                      {campaignDetailForView.detailImagePaths?.length > 0 && (
                        <>
                          <p className="fd-section-header">상세 이미지</p>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
                            {campaignDetailForView.detailImagePaths.map((imagePath, index) => (
                              <div key={`${imagePath}-${index}`} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #e2e8f0" }}>
                                <img src={toImageSrc(imagePath)} alt={`상세 이미지 ${index + 1}`} style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <div className="fd-detail-info-grid">
                        {[
                          ["카테고리", campaignDetailForView.category || "-"],
                          ["수혜자 코드", campaignDetailForView.entryCode || "-"],
                          ["목표 금액", `${formatWon(campaignDetailForView.targetAmount)}원`],
                          ["현재 금액", `${formatWon(campaignDetailForView.currentAmount)}원`],
                          ["모집 시작일", campaignDetailForView.startAt?.slice?.(0, 10) || "-"],
                          ["모집 종료일", campaignDetailForView.endAt?.slice?.(0, 10) || "-"],
                          ["사업 시작일", campaignDetailForView.usageStartAt?.slice?.(0, 10) || "-"],
                          ["사업 종료일", campaignDetailForView.usageEndAt?.slice?.(0, 10) || "-"],
                          ["진행률", `${campaignDetailForView.progressPercent ?? 0}%`],
                          ["남은 기간", `D-${campaignDetailForView.daysLeft ?? 0}`],
                          ["지갑 주소", campaignDetailForView.walletAddress || "-"],
                          ["상태", formatStatusLabel(campaignDetailForView.campaignStatus || campaignDetailForView.approvalStatus)],
                        ].map(([label, value]) => (
                          <div key={label} className="fd-detail-info-cell">
                            <span style={{ fontSize: 11, color: "#94a3b8", display: "block", marginBottom: 2 }}>{label}</span>
                            {value}
                          </div>
                        ))}
                      </div>

                      <p className="fd-section-header" style={{ marginTop: 16 }}>지출 계획</p>
                      {campaignDetailForView.usePlans?.length > 0 ? (
                        campaignDetailForView.usePlans.map((plan) => (
                          <div key={plan.usePlanNo || plan.planContent} className="fd-use-plan-item">
                            <p className="fd-use-plan-item__content">{plan.planContent}</p>
                            <p className="fd-use-plan-item__amount">{formatWon(plan.planAmount)}원</p>
                          </div>
                        ))
                      ) : (
                        <p style={{ fontSize: 13, color: "#94a3b8" }}>지출 계획 정보가 없습니다.</p>
                      )}
                    </div>
                  )}

                  {!campaignDetailLoading && !campaignDetailError && !campaignDetailForView && (
                    <div className="fd-empty">상세 정보를 준비 중입니다. 잠시 후 다시 시도해주세요.</div>
                  )}
                </>
              ) : (
                <>
                  <div className="fd-panel__header">
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 2px", color: "#1a202c" }}>캠페인 관리</h2>
                      <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>단체에서 신청한 캠페인 진행 상태를 확인합니다.</p>
                    </div>
                    <button type="button" className="fd-panel-action-btn fd-panel-action-btn--campaign-register" onClick={() => navigate("/foundation/register")}>
                      <CirclePlus size={14} /> 캠페인 등록
                    </button>
                  </div>

                  <div className="fd-filter-tabs">
                    {CAMPAIGN_FILTERS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`fd-filter-btn ${campaignFilter === item.key ? "is-active" : ""}`}
                        onClick={() => setCampaignFilter(item.key)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {filteredCampaigns.length === 0 ? (
                    <div className="fd-empty">조건에 맞는 캠페인이 없습니다.</div>
                  ) : (
                    filteredCampaigns.map((campaign) => (
                      <article
                        key={campaign.campaignNo}
                        className="fd-campaign-item"
                        onClick={() => handleOpenCampaignDetail(campaign)}
                      >
                        <div className="fd-campaign-item__meta">
                          <span className="fd-badge">{formatStatusLabel(campaign.approvalStatus) || "-"}</span>
                          <span className="fd-campaign-item__date">{campaign.createdAt?.slice?.(0, 10) || "-"}</span>
                        </div>
                        <p className="fd-campaign-item__title">{campaign.title}</p>
                        {campaign.rejectReason && (
                          <p className="fd-campaign-item__reject">반려 사유: {campaign.rejectReason}</p>
                        )}
                        <div className="fd-progress-wrap">
                          <div className="fd-progress-info">
                            <span>{campaign.progressPercent ?? 0}%</span>
                            <span>{formatWon(campaign.currentAmount)} / {formatWon(campaign.targetAmount)}원</span>
                          </div>
                          <div className="fd-progress-bar">
                            <div className="fd-progress-bar__fill" style={{ width: `${Math.max(0, Math.min(100, campaign.progressPercent ?? 0))}%` }} />
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </>
              )}
            </div>
          )}

          {/* 알림 내역 */}
          {activeMenu === "notification" && (
            <NotificationPanel token={localStorage.getItem("foundationAccessToken") || ""} />
          )}

          {/* 정산 */}
          {activeMenu === "settlement" && (
            <div className="fd-panel fd-panel--settlement">
              <div className="fd-panel__header">
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 2px", color: "#1a202c" }}>정산 관리</h2>
                  <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>지갑 정보, 정산 내역, 환급 내역을 확인할 수 있습니다.</p>
                </div>
                <button type="button" className="fd-panel-action-btn fd-panel-action-btn--outline" onClick={loadSettlementData}>새로고침</button>
              </div>

              {settlementLoading && <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>정산 정보를 불러오는 중...</p>}
              {settlementError && <p className="fd-error-text" style={{ marginBottom: 12 }}>{settlementError}</p>}

              <div className="fd-settlement-top-grid">
                <div className="fd-wallet-card">
                  <div className="fd-wallet-card__header">
                    <h3 className="fd-wallet-card__title">지갑 정보</h3>
                  </div>
                  <div className="fd-wallet-grid">
                    <div>
                      <p className="fd-info-label">지갑 주소</p>
                      <p className="fd-info-value">{walletInfo?.walletAddress || "-"}</p>
                      <p className="fd-info-label">잔액</p>
                      <p className="fd-info-value fd-info-value--lg">
                        {walletInfo?.balance !== undefined && walletInfo?.balance !== null ? formatWon(walletInfo.balance) : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="fd-wallet-card fd-redemption-card">
                  <div className="fd-wallet-card__header">
                    <h3 className="fd-wallet-card__title">현금화 신청</h3>
                  </div>
                  <div className="fd-redemption-form">
                    <label className="fd-redemption-form__field">
                      <span className="fd-input-label"> 신청 후 1주에서 2주의 시간이 소요됩니다.</span>
                      <input
                        type="number"
                        min="1"
                        value={redemptionAmount}
                        onChange={(e) => { setRedemptionAmount(e.target.value); setRedemptionError(""); setRedemptionMessage(""); }}
                        placeholder="금액 입력"
                        className="fd-input"
                      />
                    </label>
                    <button
                      type="button"
                      className="fd-redemption-form__submit"
                      style={{ backgroundColor: BRAND_COLOR }}
                      onClick={handleRedemptionSubmit}
                      disabled={redeeming}
                    >
                      {redeeming ? "신청 중..." : "현금화 신청"}
                    </button>
                    {redemptionError ? (
                      <p className="mt-2 text-sm text-rose-600">{redemptionError}</p>
                    ) : null}
                    {redemptionMessage ? (
                      <p className="mt-2 text-sm text-emerald-600">{redemptionMessage}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <p className="fd-section-title">정산 내역</p>
              {settlements.length === 0 ? (
                <div className="fd-empty" style={{ marginBottom: 20 }}>정산 내역이 없습니다.</div>
              ) : (
                settlements.map((item) => (
                  <div key={item.settlementNo} className="fd-settlement-item">
                    <div className="fd-settlement-item__header">
                      <p className="fd-settlement-item__name">{item.campaignTitle || "-"}</p>
                      <span className="fd-badge">{formatStatusLabel(item.status) || "-"}</span>
                    </div>
                    <div className="fd-settlement-item__meta">
                      <span>총 정산금: {formatWon(item.totalAmount)}원</span>
                      <span>단체 배정금: {formatWon(item.foundationAmount)}원</span>
                      <span>정산일: {formatDateTime(item.settledAt)}</span>
                    </div>
                  </div>
                ))
              )}

              <p className="fd-section-title" style={{ marginTop: 20 }}>환급 내역</p>
              {redemptions.length === 0 ? (
                <div className="fd-empty">환급 내역이 없습니다.</div>
              ) : (
                redemptions.map((item) => (
                  <div key={item.redemptionNo} className="fd-settlement-item">
                    <div className="fd-settlement-item__header">
                      <p className="fd-settlement-item__name">환급 #{item.redemptionNo}</p>
                      <span className="fd-badge">{formatStatusLabel(item.status) || "-"}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 12, color: "#64748b" }}>
                      <span>금액: {formatWon(item.amount)}원</span>
                      <span>요청일: {formatDateTime(item.requestedAt)}</span>
                      <span>처리일: {formatDateTime(item.processedAt)}</span>
                      <span>입금일: {formatDateTime(item.cashPaidAt)}</span>
                    </div>
                    {item.failureReason && (
                      <p className="fd-error-text" style={{ marginTop: 6, background: "#fff1f2", borderRadius: 6, padding: "4px 10px" }}>실패 사유: {item.failureReason}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* 설정 */}
          {activeMenu === "settings" && (
            <div className="fd-settings-stack">
              <div className="fd-panel fd-panel--settings-hero">
                <div className="fd-settings-hero">
                  {settingsProfileImageSrc ? (
                    <img
                      src={settingsProfileImageSrc}
                      alt="기부단체 프로필"
                      className="fd-settings-hero__img"
                      onClick={() => setIsProfileImagePreviewOpen(true)}
                    />
                  ) : (
                    <div className="fd-settings-hero__placeholder">
                      <Building2 size={44} />
                    </div>
                  )}

                  <div className="fd-settings-hero__overlay">
                    <span className="fd-verified-badge">인증된 단체</span>
                    <p className="fd-settings-hero__name">{foundation?.foundationName || "-"}</p>
                    <p className="fd-settings-hero__email">{foundation?.foundationEmail || ""}</p>
                    {settingsForm.profileImageFile && (
                      <p className="fd-settings-hero__filename">{settingsForm.profileImageFile.name}</p>
                    )}
                  </div>

                  <label
                    className="fd-settings-hero__edit-label"
                    style={{ backgroundColor: settingsEditMode ? BRAND_COLOR : "#e2e8f0", cursor: settingsEditMode ? "pointer" : "default" }}
                    title={settingsEditMode ? "프로필 이미지 변경" : "정보 수정 모드에서 변경 가능"}
                  >
                    <Camera size={14} color={settingsEditMode ? "#fff" : "#94a3b8"} />
                    <input type="file" accept="image/*" onChange={handleSettingsImageChange} style={{ display: "none" }} disabled={!settingsEditMode} />
                  </label>
                </div>
              </div>

              <div className="fd-panel">
                <form onSubmit={handleSettingsSubmit}>
                  <div className="fd-form-grid" style={{ marginBottom: 16 }}>
                    <div className="fd-form-field">
                      <span className="fd-form-label">사업자 등록번호</span>
                      <span className="fd-form-value">{foundation?.businessRegistrationNumber || "-"}</span>
                    </div>
                    <div className="fd-form-field">
                      <span className="fd-form-label">대표자</span>
                      <span className="fd-form-value">{foundation?.representativeName || "-"}</span>
                    </div>
                    <label className="fd-form-field">
                      <span className="fd-form-label">연락처</span>
                      {settingsEditMode
                        ? <input name="contactPhone" value={settingsForm.contactPhone} onChange={handleSettingsChange} className="fd-form-input" />
                        : <span className="fd-form-value">{settingsForm.contactPhone || "-"}</span>}
                    </label>
                    <div className="fd-form-field">
                      <span className="fd-form-label">이메일</span>
                      <span className="fd-form-value">{foundation?.foundationEmail || "-"}</span>
                    </div>
                    <label className="fd-form-field">
                      <span className="fd-form-label">계좌번호</span>
                      {settingsEditMode
                        ? <input name="account" value={settingsForm.account} onChange={handleSettingsChange} className="fd-form-input" />
                        : <span className="fd-form-value">{settingsForm.account || "-"}</span>}
                    </label>
                    <label className="fd-form-field">
                      <span className="fd-form-label">은행명</span>
                      {settingsEditMode
                        ? <input name="bankName" value={settingsForm.bankName} onChange={handleSettingsChange} className="fd-form-input" />
                        : <span className="fd-form-value">{settingsForm.bankName || "-"}</span>}
                    </label>
                    <label className="fd-form-field">
                      <span className="fd-form-label">수수료율</span>
                      {settingsEditMode
                        ? <input name="feeRate" type="number" step="0.01" min="0" max="1" value={settingsForm.feeRate} onChange={handleSettingsChange} className="fd-form-input" />
                        : <span className="fd-form-value">{settingsForm.feeRate || "-"}</span>}
                    </label>
                  </div>

                  <label className="fd-form-field" style={{ marginBottom: 16 }}>
                    <span className="fd-form-label">단체 소개</span>
                    {settingsEditMode
                      ? <textarea name="description" rows={4} value={settingsForm.description} onChange={handleSettingsChange} className="fd-form-textarea" />
                      : <span className="fd-form-value" style={{ whiteSpace: "pre-wrap" }}>{settingsForm.description || "-"}</span>}
                  </label>

                  {settingsEditMode && (
                    <div className="fd-password-grid">
                      <label className="fd-form-field">
                        <span className="fd-form-label">현재 비밀번호</span>
                        <input type="password" name="currentPassword" value={passwordForm.currentPassword} onChange={handlePasswordChange} autoComplete="current-password" className="fd-form-input" placeholder="변경 시 입력" />
                      </label>
                      <label className="fd-form-field">
                        <span className="fd-form-label">새 비밀번호</span>
                        <input type="password" name="newPassword" value={passwordForm.newPassword} onChange={handlePasswordChange} autoComplete="new-password" className="fd-form-input" placeholder="변경 시 입력" />
                      </label>
                      <label className="fd-form-field">
                        <span className="fd-form-label">새 비밀번호 확인</span>
                        <input type="password" name="confirmPassword" value={passwordForm.confirmPassword} onChange={handlePasswordChange} autoComplete="new-password" className="fd-form-input" placeholder="변경 시 입력" />
                      </label>
                    </div>
                  )}

                  {settingsError && <p className="fd-error-text">{settingsError}</p>}
                  {settingsMessage && <p className="fd-success-text">{settingsMessage}</p>}

                  <div className="fd-form-actions">
                    {settingsEditMode ? (
                      <>
                        <button type="submit" className="fd-btn-primary" disabled={settingsSaving}>{settingsSaving ? "저장 중..." : "정보 저장하기"}</button>
                        <button type="button" className="fd-btn-secondary" onClick={handleCancelSettingsEdit}>취소</button>
                      </>
                    ) : (
                      <button type="button" className="fd-btn-secondary" onClick={handleStartSettingsEdit}>정보 수정하기</button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}
          {isProfileImagePreviewOpen && settingsProfileImageSrc && (
            <div
              className="fd-image-modal"
              role="dialog"
              aria-modal="true"
              aria-label="프로필 이미지 전체보기"
              onClick={() => setIsProfileImagePreviewOpen(false)}
            >
              <div
                className="fd-image-modal__content"
                onClick={(event) => event.stopPropagation()}
              >
                <button
                  type="button"
                  className="fd-image-modal__close"
                  onClick={() => setIsProfileImagePreviewOpen(false)}
                  aria-label="닫기"
                >
                  <X size={18} />
                </button>
                <img
                  src={settingsProfileImageSrc}
                  alt="기부단체 프로필 전체 이미지"
                  className="fd-image-modal__img"
                />
              </div>
            </div>
          )}
        </div>
    </div>
  );
}

export default FoundationDashboardPage;
