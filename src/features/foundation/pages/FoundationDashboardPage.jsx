import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Building2,
  Camera,
  CirclePlus,
  FileClock,
  House,
  Layers,
  Settings,
  Wallet,
  Pencil,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  fetchFoundationMyInfo,
  fetchFoundationPublicDetail,
  fetchFoundationMyStats,
  fetchCampaignDetail,
  fetchPendingCampaignEditDetail,
  fetchFoundationRecentCampaigns,
  fetchFoundationWalletInfo,
  fetchFoundationSettlements,
  fetchFoundationRedemptions,
  getFoundationNoFromAccessToken,
  requestFoundationRedemption,
  updateFoundationMyInfo,
} from "../api/foundationApi";

const BRAND_COLOR = "#FFF200";

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

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  if (path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
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

function FoundationDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeMenu, setActiveMenu] = useState(
    searchParams.get("menu") || "home",
  );
  const [campaignFilter, setCampaignFilter] = useState("all");

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
  const [walletInfo, setWalletInfo] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [settlementLoading, setSettlementLoading] = useState(false);
  const [settlementError, setSettlementError] = useState("");
  const [redemptionAmount, setRedemptionAmount] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redemptionMessage, setRedemptionMessage] = useState("");
  const [redemptionError, setRedemptionError] = useState("");

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
            fetchFoundationRecentCampaigns({ size: 50 }),
          ]);

        if (!mounted) {
          return;
        }

        setFoundation(foundationInfo);
        setStats(foundationStats);
        setCampaigns(campaignPage?.content || []);
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

  useEffect(() => {
    if (!foundation?.foundationNo) {
      return;
    }

    let mounted = true;
    const loadPublicDetail = async () => {
      try {
        const publicDetail = await fetchFoundationPublicDetail(foundation.foundationNo);
        if (!mounted) {
          return;
        }

        setFoundation((previous) => ({
          ...previous,
          bankName: publicDetail.bankName ?? previous.bankName,
          feeRate: publicDetail.feeRate ?? previous.feeRate,
        }));

        setSettingsForm((previous) => ({
          ...previous,
          bankName: publicDetail.bankName ?? previous.bankName,
          feeRate:
            publicDetail.feeRate !== undefined && publicDetail.feeRate !== null
              ? String(publicDetail.feeRate)
              : previous.feeRate,
        }));
      } catch {
        // /me 응답에 없는 필드를 보완 조회하는 용도라 실패해도 화면은 유지한다.
      }
    };

    loadPublicDetail();
    return () => {
      mounted = false;
    };
  }, [foundation?.foundationNo]);

  const summary = useMemo(
    () => ({
      foundationName: foundation?.foundationName || "단체명",
      activeCount: stats?.activeCampaignCount ?? 0,
      monthlyAmount: stats?.thisMonthDonationAmount ?? 0,
    }),
    [foundation, stats],
  );

  const recentCampaigns = useMemo(() => campaigns.slice(0, 2), [campaigns]);

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((campaign) =>
        isMatchCampaignFilter(campaign, campaignFilter),
      ),
    [campaignFilter, campaigns],
  );

  const canEditPendingCampaign = useMemo(() => {
    const approval = String(campaignDetail?.approvalStatus || "").toUpperCase();
    const status = String(campaignDetail?.campaignStatus || "").toUpperCase();
    return approval === "PENDING" && status === "PENDING";
  }, [campaignDetail]);

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
      let detail = null;

      if (isPendingHint) {
        detail = await fetchPendingCampaignEditDetail(campaignNo);
      } else {
        try {
          detail = await fetchCampaignDetail(campaignNo);
        } catch {
          detail = await fetchPendingCampaignEditDetail(campaignNo);
        }
      }

      setCampaignDetail(detail);
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

  const handleSettingsSubmit = async (event) => {
    event.preventDefault();

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
      setSettingsEditMode(false);
      setSettingsMessage("기부단체 정보가 저장되었습니다.");
    } catch (error) {
      setSettingsError(error.message || "기부단체 정보 수정에 실패했습니다.");
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleStartSettingsEdit = () => {
    setSettingsMessage("");
    setSettingsError("");
    setSettingsEditMode(true);
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

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f2f4f7] p-8 text-sm text-slate-600">
        불러오는 중...
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen bg-[#f2f4f7] p-8">
        <div className="mx-auto max-w-4xl rounded-3xl border border-rose-200 bg-white p-6">
          <p className="text-sm text-rose-600">{errorMessage}</p>
          <button
            type="button"
            className="mt-4 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => navigate("/login")}
          >
            로그인으로 이동
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5f2] text-slate-900">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-6 px-4 py-4 lg:grid-cols-[160px_1fr]">
        <aside className="rounded-[28px] bg-white p-4">
          <div className="mb-8 flex items-center gap-2 text-sm font-bold">
            기부엔토큰
          </div>

          <nav className="space-y-2 text-sm">
            <button
              type="button"
              className={`w-full rounded-2xl px-3 py-2 text-left ${
                activeMenu === "home"
                  ? "font-semibold text-slate-900"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
              style={activeMenu === "home" ? { backgroundColor: BRAND_COLOR } : undefined}
              onClick={handleGoHome}
            >
              <span className="flex items-center gap-2">
                <House size={14} /> 홈
              </span>
            </button>
            <button
              type="button"
              className={`w-full rounded-2xl px-3 py-2 text-left ${
                activeMenu === "campaign"
                  ? "font-semibold text-slate-900"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
              style={activeMenu === "campaign" ? { backgroundColor: BRAND_COLOR } : undefined}
              onClick={() => handleOpenMenu("campaign")}
            >
              <span className="flex items-center gap-2">
                <Layers size={14} /> 캠페인
              </span>
            </button>
            <button
              type="button"
              className={`w-full rounded-2xl px-3 py-2 text-left ${
                activeMenu === "settlement"
                  ? "font-semibold text-slate-900"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
              style={activeMenu === "settlement" ? { backgroundColor: BRAND_COLOR } : undefined}
              onClick={() => handleOpenMenu("settlement")}
            >
              <span className="flex items-center gap-2">
                <Wallet size={14} /> 정산
              </span>
            </button>
            <button
              type="button"
              className={`w-full rounded-2xl px-3 py-2 text-left ${
                activeMenu === "settings"
                  ? "font-semibold text-slate-900"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
              style={activeMenu === "settings" ? { backgroundColor: BRAND_COLOR } : undefined}
              onClick={() => handleOpenMenu("settings")}
            >
              <span className="flex items-center gap-2">
                <Settings size={14} /> 정보관리
              </span>
            </button>
          </nav>
        </aside>

        <section className="space-y-4">
          <header className="flex items-center justify-between rounded-[28px] bg-white px-6 py-4">
            <h1 className="text-lg font-bold">기부단체 마이페이지</h1>
          </header>

          {activeMenu === "home" ? (
            <>
              <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
                <article
                  className="rounded-[28px] p-6 text-slate-900 shadow-xl"
                  style={{ background: "linear-gradient(135deg, #eef8a3 0%, #E0F218 100%)" }}
                >
                  <p className="text-xs text-slate-700">반갑습니다</p>
                  <h2 className="mt-2 text-2xl font-bold leading-tight">
                    {summary.foundationName}
                  </h2>

                  <div className="mt-6 space-y-3">
                    <div className="rounded-2xl bg-white/70 p-4">
                      <p className="text-xs text-slate-700">진행 중인 캠페인</p>
                      <p className="mt-1 text-3xl font-bold">
                        {summary.activeCount}개
                      </p>
                    </div>
                    <div className="rounded-2xl bg-white/70 p-4">
                      <p className="text-xs text-slate-700">이달 모금 금액</p>
                      <p className="mt-1 text-3xl font-bold">
                        {formatWon(summary.monthlyAmount)}원
                      </p>
                    </div>
                  </div>
                </article>

                <article className="rounded-[28px] bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-700">
                      최근 신청 현황
                    </h3>
                    <button
                      type="button"
                      className="text-xs font-semibold text-slate-700"
                      style={{ color: "#7c8600" }}
                      onClick={() => handleOpenMenu("campaign")}
                    >
                      전체보기
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {recentCampaigns.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                        최근 신청한 캠페인이 없습니다.
                      </div>
                    ) : (
                      recentCampaigns.map((campaign) => (
                        <button
                          key={campaign.campaignNo}
                          type="button"
                          className="rounded-2xl border border-slate-200 p-4 text-left hover:bg-slate-50"
                          onClick={() => {
                            handleOpenMenu("campaign");
                            handleOpenCampaignDetail(campaign);
                          }}
                        >
                          <p className="text-xs text-slate-500">
                            {campaign.createdAt?.slice?.(0, 10) || "-"}
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm font-semibold">
                            {campaign.title}
                          </p>
                          <p className="mt-2 text-xs text-slate-500">
                            {campaign.progressPercent ?? 0}% ·{" "}
                            {formatWon(campaign.currentAmount)} /{" "}
                            {formatWon(campaign.targetAmount)}원
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </article>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:max-w-[360px]">
                <button
                  type="button"
                  className="rounded-3xl bg-white px-5 py-4 text-left shadow-sm"
                  onClick={() => navigate("/foundation/register")}
                >
                  <div className="flex items-center gap-3">
                    <CirclePlus size={18} className="text-slate-900" />
                    <div>
                      <p className="text-sm font-bold">새 캠페인 신청</p>
                      <p className="text-xs text-slate-500">
                        새로운 캠페인을 등록하세요
                      </p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  className="rounded-3xl bg-white px-5 py-4 text-left shadow-sm"
                  onClick={() => handleOpenMenu("campaign")}
                >
                  <div className="flex items-center gap-3">
                    <FileClock size={18} className="text-amber-500" />
                    <div>
                      <p className="text-sm font-bold">신청 목록 조회</p>
                      <p className="text-xs text-slate-500">
                        진행 상태를 확인하세요
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </>
          ) : null}

          {activeMenu === "campaign" ? (
            <section className="rounded-[28px] bg-white p-6">
              {selectedCampaignNo ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                      onClick={handleBackToCampaignList}
                    >
                      <ArrowLeft size={16} />
                      목록으로
                    </button>
                    {canEditPendingCampaign ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-900"
                        style={{ backgroundColor: BRAND_COLOR }}
                        onClick={() =>
                          navigate(
                            `/foundation/register?editCampaignNo=${selectedCampaignNo}`,
                          )
                        }
                      >
                        <Pencil size={14} />
                        심사중 수정
                      </button>
                    ) : null}
                  </div>

                  {campaignDetailLoading ? (
                    <p className="text-sm text-slate-500">
                      상세 불러오는 중...
                    </p>
                  ) : null}
                  {campaignDetailError ? (
                    <p className="text-sm text-rose-600">
                      {campaignDetailError}
                    </p>
                  ) : null}

                  {campaignDetail ? (
                    <article className="space-y-6 rounded-2xl border border-slate-200 p-5">
                      <header className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-2xl font-bold">{campaignDetail.title}</h3>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {formatStatusLabel(campaignDetail.campaignStatus || campaignDetail.approvalStatus)}
                          </span>
                        </div>
                      </header>

                      {campaignDetail.representativeImagePath ? (
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                          <img
                            src={toImageSrc(
                              campaignDetail.representativeImagePath,
                            )}
                            alt={campaignDetail.title}
                            className="h-72 w-full object-cover"
                          />
                        </div>
                      ) : null}

                      <section className="space-y-2">
                        <h4 className="text-base font-bold">상세 설명</h4>
                        <p className="text-sm leading-6 text-slate-600">{campaignDetail.description || "-"}</p>
                      </section>

                      {campaignDetail.detailImagePaths?.length > 0 ? (
                        <section className="space-y-2">
                          <h4 className="text-base font-bold">상세 이미지</h4>
                          <div className="grid gap-3 md:grid-cols-3">
                          {campaignDetail.detailImagePaths.map(
                            (imagePath, index) => (
                              <div
                                key={`${imagePath}-${index}`}
                                className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                              >
                                <img
                                  src={toImageSrc(imagePath)}
                                  alt={`상세 이미지 ${index + 1}`}
                                  className="h-36 w-full object-cover"
                                />
                              </div>
                            ),
                          )}
                          </div>
                        </section>
                      ) : null}

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-3 text-sm">
                          카테고리: {campaignDetail.category || "-"}
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-sm">
                          수혜자 코드: {campaignDetail.entryCode || "-"}
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-sm">
                          목표 금액: {formatWon(campaignDetail.targetAmount)}원
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-sm">
                          현재 금액: {formatWon(campaignDetail.currentAmount)}원
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-sm">
                          모집 시작일:{" "}
                          {campaignDetail.startAt?.slice?.(0, 10) || "-"}
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-sm">
                          모집 종료일:{" "}
                          {campaignDetail.endAt?.slice?.(0, 10) || "-"}
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-sm">
                          사업 시작일:{" "}
                          {campaignDetail.usageStartAt?.slice?.(0, 10) || "-"}
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-sm">
                          사업 종료일:{" "}
                          {campaignDetail.usageEndAt?.slice?.(0, 10) || "-"}
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-sm">
                          진행률: {campaignDetail.progressPercent ?? 0}%
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-sm">
                          남은 기간: D-{campaignDetail.daysLeft ?? 0}
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-sm">
                          지갑 주소: {campaignDetail.walletAddress || "-"}
                        </div>
                        <div className="rounded-xl bg-slate-50 p-3 text-sm">
                          상태: {formatStatusLabel(campaignDetail.campaignStatus || campaignDetail.approvalStatus)}
                        </div>
                      </div>

                      <section className="space-y-2">
                        <h4 className="text-base font-bold">지출 계획</h4>
                        {campaignDetail.usePlans?.length > 0 ? (
                          <div className="space-y-2">
                            {campaignDetail.usePlans.map((plan) => (
                              <div
                                key={plan.usePlanNo || plan.planContent}
                                className="rounded-xl border border-slate-200 p-3 text-sm"
                              >
                                <div className="font-medium text-slate-800">
                                  {plan.planContent}
                                </div>
                                <div className="mt-1 text-slate-500">
                                  {formatWon(plan.planAmount)}원
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-slate-500">
                            지출 계획 정보가 없습니다.
                          </p>
                        )}
                      </section>
                    </article>
                  ) : null}

                  {!campaignDetailLoading && !campaignDetailError && !campaignDetail ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                      상세 정보를 준비 중입니다. 잠시 후 다시 시도해주세요.
                    </div>
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">캠페인 관리</h2>
                      <p className="text-xs text-slate-500">
                        단체에서 신청한 캠페인 진행 상태를 확인합니다.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-900"
                      style={{ backgroundColor: BRAND_COLOR }}
                      onClick={() => navigate("/foundation/register")}
                    >
                      <CirclePlus size={16} /> 캠페인 등록
                    </button>
                  </div>

                  <div className="mb-5 flex flex-wrap gap-2">
                    {CAMPAIGN_FILTERS.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                          campaignFilter === item.key
                            ? "text-slate-900"
                            : "bg-slate-100 text-slate-500"
                        }`}
                        style={campaignFilter === item.key ? { backgroundColor: BRAND_COLOR } : undefined}
                        onClick={() => setCampaignFilter(item.key)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {filteredCampaigns.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                        조건에 맞는 캠페인이 없습니다.
                      </div>
                    ) : (
                      filteredCampaigns.map((campaign) => (
                        <article
                          key={campaign.campaignNo}
                          className="cursor-pointer rounded-2xl border border-slate-200 p-4 hover:bg-slate-50"
                          onClick={() => handleOpenCampaignDetail(campaign)}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold text-slate-800" style={{ backgroundColor: "#f3f8c1" }}>
                              {formatStatusLabel(campaign.approvalStatus) || "-"}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {campaign.createdAt?.slice?.(0, 10) || "-"}
                            </span>
                          </div>

                          <h3 className="text-base font-semibold">
                            {campaign.title}
                          </h3>

                          {campaign.rejectReason ? (
                            <p className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-600">
                              반려 사유: {campaign.rejectReason}
                            </p>
                          ) : null}

                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                              <span>{campaign.progressPercent ?? 0}%</span>
                              <span>
                                {formatWon(campaign.currentAmount)} /{" "}
                                {formatWon(campaign.targetAmount)}원
                              </span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.max(0, Math.min(100, campaign.progressPercent ?? 0))}%`,
                                  backgroundColor: BRAND_COLOR,
                                }}
                              />
                            </div>
                          </div>

                        </article>
                      ))
                    )}
                  </div>
                </>
              )}
            </section>
          ) : null}

          {activeMenu === "settlement" ? (
            <section className="rounded-[28px] bg-white p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">정산 관리</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    지갑 정보, 정산 내역, 환급 내역을 확인할 수 있습니다.
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={loadSettlementData}
                >
                  새로고침
                </button>
              </div>

              {settlementLoading ? (
                <p className="mb-4 text-sm text-slate-500">정산 정보를 불러오는 중...</p>
              ) : null}
              {settlementError ? (
                <p className="mb-4 text-sm text-rose-600">{settlementError}</p>
              ) : null}

              <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-800">기부단체 지갑 정보</h3>
                  <button
                    type="button"
                    className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                    style={{ backgroundColor: BRAND_COLOR }}
                    onClick={handleRedemptionSubmit}
                    disabled={redeeming}
                  >
                    {redeeming ? "신청 중..." : "현금화 신청"}
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                  <div>
                    <p className="text-xs text-slate-500">지갑 주소</p>
                    <p className="break-all text-sm font-semibold text-slate-800">
                      {walletInfo?.walletAddress || "-"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">잔액</p>
                    <p className="text-lg font-bold text-slate-900">
                      {walletInfo?.balance !== undefined && walletInfo?.balance !== null
                        ? formatWon(walletInfo.balance)
                        : "-"}
                    </p>
                  </div>
                  <label className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-slate-600">현금화 금액</span>
                    <input
                      type="number"
                      min="1"
                      value={redemptionAmount}
                      onChange={(event) => {
                        setRedemptionAmount(event.target.value);
                        setRedemptionError("");
                        setRedemptionMessage("");
                      }}
                      placeholder="금액 입력"
                      className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                {redemptionError ? (
                  <p className="mt-2 text-sm text-rose-600">{redemptionError}</p>
                ) : null}
                {redemptionMessage ? (
                  <p className="mt-2 text-sm text-emerald-600">{redemptionMessage}</p>
                ) : null}
              </div>

              <div className="mb-6">
                <h3 className="mb-3 text-base font-bold text-slate-800">정산 내역</h3>
                {settlements.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    정산 내역이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {settlements.map((item) => (
                      <article
                        key={item.settlementNo}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">
                            {item.campaignTitle || "-"}
                          </p>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {formatStatusLabel(item.status) || "-"}
                          </span>
                        </div>
                        <div className="mt-2 grid gap-2 text-xs text-slate-600 md:grid-cols-3">
                          <p>총 정산금: {formatWon(item.totalAmount)}원</p>
                          <p>단체 배정금: {formatWon(item.foundationAmount)}원</p>
                          <p>정산일: {formatDateTime(item.settledAt)}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-base font-bold text-slate-800">환급 내역</h3>
                {redemptions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
                    환급 내역이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {redemptions.map((item) => (
                      <article
                        key={item.redemptionNo}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-800">
                            환급 #{item.redemptionNo}
                          </p>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {formatStatusLabel(item.status) || "-"}
                          </span>
                        </div>
                        <div className="mt-2 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                          <p>금액: {formatWon(item.amount)}원</p>
                          <p>요청일: {formatDateTime(item.requestedAt)}</p>
                          <p>처리일: {formatDateTime(item.processedAt)}</p>
                          <p>입금일: {formatDateTime(item.cashPaidAt)}</p>
                        </div>
                        {item.failureReason ? (
                          <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
                            실패 사유: {item.failureReason}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {activeMenu === "settings" ? (
            <section className="space-y-5">
              <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
                <div className="flex flex-col items-center px-6 py-8 text-center">
                  <div className="relative mb-4">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[24px] bg-slate-100 text-slate-400">
                      {foundation?.profilePath ? (
                        <img
                          src={toImageSrc(foundation.profilePath)}
                          alt="기부단체 프로필"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Building2 size={32} />
                      )}
                    </div>
                    <label
                      className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white ${
                        settingsEditMode ? "cursor-pointer text-slate-900" : "bg-slate-200 text-slate-500"
                      }`}
                      style={settingsEditMode ? { backgroundColor: BRAND_COLOR } : undefined}
                      title={settingsEditMode ? "프로필 이미지 변경" : "정보 수정 모드에서 변경 가능"}
                    >
                      <Camera size={13} />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSettingsImageChange}
                        className="hidden"
                        disabled={!settingsEditMode}
                      />
                    </label>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900">{foundation?.foundationName || "-"}</h2>
                  <span className="mt-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                    인증된 단체
                  </span>
                  {settingsForm.profileImageFile ? (
                    <p className="mt-2 text-xs text-slate-700">{settingsForm.profileImageFile.name}</p>
                  ) : null}
                </div>
              </article>

              <article className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
                <form className="space-y-6 px-6 py-7" onSubmit={handleSettingsSubmit}>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-medium text-slate-400">사업자 등록번호</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{foundation?.businessRegistrationNumber || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400">대표자</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{foundation?.representativeName || "-"}</p>
                    </div>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-400">연락처</span>
                      {settingsEditMode ? (
                        <input
                          name="contactPhone"
                          value={settingsForm.contactPhone}
                          onChange={handleSettingsChange}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="mt-1 text-sm font-semibold text-slate-800">{settingsForm.contactPhone || "-"}</p>
                      )}
                    </label>
                    <div>
                      <p className="text-xs font-medium text-slate-400">이메일</p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">{foundation?.foundationEmail || "-"}</p>
                    </div>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-400">계좌번호</span>
                      {settingsEditMode ? (
                        <input
                          name="account"
                          value={settingsForm.account}
                          onChange={handleSettingsChange}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="mt-1 text-sm font-semibold text-slate-800">{settingsForm.account || "-"}</p>
                      )}
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-400">은행명</span>
                      {settingsEditMode ? (
                        <input
                          name="bankName"
                          value={settingsForm.bankName}
                          onChange={handleSettingsChange}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="mt-1 text-sm font-semibold text-slate-800">{settingsForm.bankName || "-"}</p>
                      )}
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-slate-400">수수료율</span>
                      {settingsEditMode ? (
                        <input
                          name="feeRate"
                          type="number"
                          step="0.01"
                          min="0"
                          max="1"
                          value={settingsForm.feeRate}
                          onChange={handleSettingsChange}
                          className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                        />
                      ) : (
                        <p className="mt-1 text-sm font-semibold text-slate-800">{settingsForm.feeRate || "-"}</p>
                      )}
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-xs font-medium text-slate-400">단체 소개</span>
                    {settingsEditMode ? (
                      <textarea
                        name="description"
                        rows="4"
                        value={settingsForm.description}
                        onChange={handleSettingsChange}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      />
                    ) : (
                      <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-700">
                        {settingsForm.description || "-"}
                      </p>
                    )}
                  </label>

                  {settingsError ? <p className="text-sm text-rose-600">{settingsError}</p> : null}
                  {settingsMessage ? <p className="text-sm text-emerald-600">{settingsMessage}</p> : null}

                  <div className="border-t border-slate-100 pt-4">
                    <div className="flex justify-center gap-2">
                      {settingsEditMode ? (
                        <>
                          <button
                            type="button"
                            onClick={handleCancelSettingsEdit}
                            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            취소
                          </button>
                          <button
                            type="submit"
                            disabled={settingsSaving}
                            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                            style={{ backgroundColor: BRAND_COLOR }}
                          >
                            {settingsSaving ? "저장 중..." : "정보 저장하기"}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStartSettingsEdit}
                          className="rounded-xl bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          정보 수정하기
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </article>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}

export default FoundationDashboardPage;
