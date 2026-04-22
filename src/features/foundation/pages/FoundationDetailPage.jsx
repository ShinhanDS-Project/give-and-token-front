import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Copy, Wallet } from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

const CAMPAIGN_STATUS_LABEL = {
  IN_PROGRESS: "\uC9C4\uD589\uC911",
  COMPLETED: "\uC885\uB8CC",
  PENDING: "\uB300\uAE30",
  REJECTED: "\uBC18\uB824",
};

function normalizeImagePath(imagePath) {
  if (!imagePath) return "";
  const rawPath = String(imagePath).trim();
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

function formatWon(value) {
  const num = Number(value || 0);
  return `${num.toLocaleString("ko-KR")}\uC6D0`;
}

function formatFeeRate(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return "-";
  const percent = num * 100;
  const text = Number.isInteger(percent) ? String(percent) : percent.toFixed(2).replace(/\.?0+$/, "");
  return `${text}%`;
}

function shortenAddress(address) {
  if (!address) return "";
  const addr = String(address);
  if (addr.length <= 18) return addr;
  return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
}

function formatDate(value) {
  if (!value) return "-";

  // Supports Java LocalDate/LocalDateTime array payloads like [2026, 4, 21, 13, 30, 0]
  if (Array.isArray(value)) {
    const year = Number(value[0]);
    const month = Number(value[1] || 1);
    const day = Number(value[2] || 1);
    const hour = Number(value[3] || 0);
    const minute = Number(value[4] || 0);
    const second = Number(value[5] || 0);
    if (Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day)) {
      const arrayDate = new Date(year, month - 1, day, hour, minute, second);
      if (!Number.isNaN(arrayDate.getTime())) {
        return new Intl.DateTimeFormat("ko-KR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(arrayDate);
      }
    }
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatPeriod(startAt, endAt) {
  return `${formatDate(startAt)} ~ ${formatDate(endAt)}`;
}

function getRecruitPeriod(campaign) {
  const recruitStart =
    campaign?.recruitStartAt ||
    campaign?.recruitStartDate ||
    campaign?.recruitStart ||
    campaign?.recruitBeginAt ||
    campaign?.recruitFrom ||
    campaign?.applicationStartAt ||
    campaign?.startAt ||
    campaign?.startDate;
  const recruitEnd =
    campaign?.recruitEndAt ||
    campaign?.recruitEndDate ||
    campaign?.recruitEnd ||
    campaign?.recruitFinishAt ||
    campaign?.recruitTo ||
    campaign?.applicationEndAt ||
    campaign?.endAt ||
    campaign?.endDate;
  if (!recruitStart && !recruitEnd) {
    return "\uBAA8\uC9D1 \uAE30\uAC04 \uBBF8\uC815";
  }
  return formatPeriod(recruitStart, recruitEnd);
}

function normalizeCampaignList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function hasFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function needsCampaignEnrichment(campaign) {
  const hasRaised =
    hasFiniteNumber(campaign?.currentAmount) ||
    hasFiniteNumber(campaign?.raisedAmount) ||
    hasFiniteNumber(campaign?.raised) ||
    hasFiniteNumber(campaign?.donationAmount) ||
    hasFiniteNumber(campaign?.totalRaisedAmount);
  const hasProgress =
    hasFiniteNumber(campaign?.progressPercent) ||
    hasFiniteNumber(campaign?.progress) ||
    hasFiniteNumber(campaign?.achievementRate);
  const hasImage = Boolean(
    campaign?.imagePath || campaign?.representativeImagePath || campaign?.thumbnailPath,
  );
  return !hasRaised || !hasProgress || !hasImage;
}

function mergeCampaignWithDetail(campaign, detail) {
  if (!detail) return campaign;
  return {
    ...campaign,
    currentAmount:
      campaign?.currentAmount ??
      detail?.currentAmount ??
      detail?.raisedAmount ??
      detail?.raised ??
      detail?.donationAmount ??
      detail?.totalRaisedAmount,
    targetAmount:
      campaign?.targetAmount ??
      detail?.targetAmount ??
      detail?.goalAmount ??
      detail?.goal ??
      detail?.targetDonationAmount,
    progressPercent:
      campaign?.progressPercent ??
      detail?.progressPercent ??
      detail?.progress ??
      detail?.achievementRate,
    imagePath:
      campaign?.imagePath ??
      detail?.representativeImagePath ??
      detail?.imagePath ??
      detail?.thumbnailPath,
    representativeImagePath:
      campaign?.representativeImagePath ??
      detail?.representativeImagePath ??
      detail?.imagePath,
    recruitStartAt:
      campaign?.recruitStartAt ??
      campaign?.recruitStartDate ??
      campaign?.recruitStart ??
      detail?.recruitStartAt ??
      detail?.recruitStartDate ??
      detail?.recruitStart ??
      detail?.startAt,
    recruitEndAt:
      campaign?.recruitEndAt ??
      campaign?.recruitEndDate ??
      campaign?.recruitEnd ??
      detail?.recruitEndAt ??
      detail?.recruitEndDate ??
      detail?.recruitEnd ??
      detail?.endAt,
    title: campaign?.title || detail?.title,
    campaignStatus: campaign?.campaignStatus || detail?.campaignStatus || detail?.status,
  };
}

function toCampaignNumber(...values) {
  for (const value of values) {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return 0;
}

function toTimestamp(value) {
  if (!value) return null;
  if (Array.isArray(value)) {
    const year = Number(value[0]);
    const month = Number(value[1] || 1);
    const day = Number(value[2] || 1);
    const hour = Number(value[3] || 0);
    const minute = Number(value[4] || 0);
    const second = Number(value[5] || 0);
    const date = new Date(year, month - 1, day, hour, minute, second);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
}

function isCampaignClosed(campaign) {
  const status = String(campaign?.campaignStatus || campaign?.status || "").toUpperCase();
  if (["COMPLETED", "ENDED", "CLOSED", "FINISHED", "EXPIRED", "REJECTED"].includes(status)) {
    return true;
  }

  const endValue =
    campaign?.recruitEndAt ||
    campaign?.recruitEndDate ||
    campaign?.recruitEnd ||
    campaign?.endAt ||
    campaign?.endDate;
  const endTime = toTimestamp(endValue);
  return Number.isFinite(endTime) ? endTime < Date.now() : false;
}

export default function FoundationDetailPage() {
  const { foundationNo } = useParams();
  const navigate = useNavigate();

  const [foundation, setFoundation] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadFoundationDetail() {
      try {
        setLoading(true);
        setError("");

        const [foundationRes, walletRes, campaignsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/foundation/${foundationNo}`),
          fetch(`${API_BASE_URL}/api/foundation/${foundationNo}/wallet`),
          fetch(`${API_BASE_URL}/api/foundation/${foundationNo}/campaigns?page=0&size=100`),
        ]);

        if (!foundationRes.ok) throw new Error(`\uAE30\uBD80\uB2E8\uCCB4 \uC870\uD68C \uC2E4\uD328: ${foundationRes.status}`);

        const [foundationData, walletData, campaignsData] = await Promise.all([
          foundationRes.json(),
          walletRes.ok ? walletRes.json() : Promise.resolve(null),
          campaignsRes.ok ? campaignsRes.json() : Promise.resolve([]),
        ]);

        if (cancelled) return;

        if (!foundationData.foundationEmail && foundationData.foundationName) {
          try {
            const listRes = await fetch(
              `${API_BASE_URL}/api/foundation/all?keyword=${encodeURIComponent(foundationData.foundationName)}&size=20`
            );
            if (listRes.ok) {
              const listData = await listRes.json();
              const items = Array.isArray(listData) ? listData : listData.content ?? [];
              const match = items.find((item) => Number(item.foundationNo) === Number(foundationNo));
              if (match?.foundationEmail) {
                foundationData.foundationEmail = match.foundationEmail;
              }
            }
          } catch {
            // Keep rendering even if email enrichment fails.
          }
        }

        if (cancelled) return;

        const campaignList = normalizeCampaignList(campaignsData);
        setFoundation(foundationData);
        setWallet(walletData);
        setCampaigns(campaignList);

        const targets = campaignList
          .filter((item) => Number.isFinite(Number(item?.campaignNo)))
          .filter((item) => needsCampaignEnrichment(item));

        if (targets.length > 0) {
          const detailPairs = await Promise.all(
            targets.map(async (item) => {
              const campaignNo = Number(item?.campaignNo);
              try {
                const response = await fetch(`${API_BASE_URL}/api/foundation/campaigns/${campaignNo}/detail`);
                if (!response.ok) return [campaignNo, null];
                const detail = await response.json();
                return [campaignNo, detail];
              } catch {
                return [campaignNo, null];
              }
            }),
          );

          if (!cancelled) {
            const detailMap = new Map(detailPairs);
            setCampaigns((prev) =>
              prev.map((item) => {
                const campaignNo = Number(item?.campaignNo);
                if (!Number.isFinite(campaignNo)) return item;
                return mergeCampaignWithDetail(item, detailMap.get(campaignNo));
              }),
            );
          }
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "\uAE30\uBD80\uB2E8\uCCB4 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadFoundationDetail();
    return () => {
      cancelled = true;
    };
  }, [foundationNo]);

  const profileImage = useMemo(() => normalizeImagePath(foundation?.profilePath), [foundation?.profilePath]);
  const activeCampaignCount = campaigns.filter((item) => !isCampaignClosed(item)).length;
  const ongoingCampaigns = useMemo(
    () => campaigns.filter((item) => !isCampaignClosed(item)),
    [campaigns],
  );
  const closedCampaigns = useMemo(
    () => campaigns.filter((item) => isCampaignClosed(item)),
    [campaigns],
  );

  const copyWallet = async () => {
    if (!wallet?.walletAddress) return;
    try {
      await navigator.clipboard.writeText(wallet.walletAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface pb-32 pt-52">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-lg font-bold text-stone-500">{"\uAE30\uBD80\uB2E8\uCCB4 \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294 \uC911\uC785\uB2C8\uB2E4."}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-surface pb-32 pt-52">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="mb-6 text-2xl font-display font-bold text-ink">{error}</h1>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-bold text-white"
          >
            {"\uC774\uC804 \uD398\uC774\uC9C0\uB85C"}
          </button>
        </div>
      </div>
    );
  }

  if (!foundation) return null;

  const renderCampaignCard = (campaign) => {
    const isClosed = isCampaignClosed(campaign);
    const campaignNo = toCampaignNumber(
      campaign?.campaignNo,
      campaign?.id,
      campaign?.campaignId,
    );
    const imageUrl = normalizeImagePath(
      campaign?.imagePath ||
      campaign?.representativeImagePath ||
      campaign?.thumbnailPath ||
      "",
    );
    const raised = toCampaignNumber(
      campaign?.currentAmount,
      campaign?.raisedAmount,
      campaign?.raised,
      campaign?.donationAmount,
      campaign?.totalRaisedAmount,
    );
    const goal = toCampaignNumber(
      campaign?.targetAmount,
      campaign?.goalAmount,
      campaign?.goal,
      campaign?.targetDonationAmount,
    );
    const progressFromApi = toCampaignNumber(
      campaign?.progressPercent,
      campaign?.progress,
      campaign?.achievementRate,
    );
    const progress =
      progressFromApi > 0
        ? Math.min(100, Math.floor(progressFromApi))
        : goal > 0
          ? Math.min(100, Math.floor((raised / goal) * 100))
          : 0;
    const statusLabel =
      CAMPAIGN_STATUS_LABEL[String(campaign?.campaignStatus || "").toUpperCase()] ||
      CAMPAIGN_STATUS_LABEL[String(campaign?.status || "").toUpperCase()] ||
      campaign?.campaignStatus ||
      campaign?.status ||
      "-";

    return (
      <Link
        key={campaignNo || `${campaign?.title || "campaign"}-${campaign?.startAt || ""}`}
        to={campaignNo ? `/campaign/${campaignNo}` : "#"}
        className="flex flex-col gap-0 overflow-hidden rounded-[1.5rem] border border-primary/30 bg-white transition-colors hover:border-primary/50 md:h-[190px] md:flex-row"
      >
        <div className="w-full shrink-0 bg-stone-100 md:w-44">
          <div className="relative aspect-[16/10] h-full w-full md:aspect-auto md:h-full">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={campaign?.title || "\uCEA0\uD398\uC778 \uC774\uBBF8\uC9C0"}
                className={`h-full w-full object-cover object-center ${isClosed ? "grayscale" : ""}`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-100 to-stone-200 text-xs font-medium text-stone-400">
                {"\uCEA0\uD398\uC778 \uC774\uBBF8\uC9C0"}
              </div>
            )}
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-4 md:p-5">
          <div className="mb-1 text-sm font-bold text-stone-400">{statusLabel}</div>
          <h3 className="line-clamp-1 text-lg font-display font-bold text-ink md:text-xl">{campaign?.title || "\uC81C\uBAA9 \uC5C6\uB294 \uCEA0\uD398\uC778"}</h3>
          <p className="mt-1 text-sm text-stone-400">{getRecruitPeriod(campaign)}</p>
          <div className="mt-auto pt-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[0.95rem] font-bold text-primary">{progress}{"% \uB2EC\uC131"}</span>
              <span className="text-sm font-display font-bold text-stone-500">
                {formatWon(raised)} / {formatWon(goal)}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-surface pb-32 pt-36">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-8 inline-flex items-center gap-2 font-medium text-stone-400 transition-colors hover:text-primary"
        >
          <ChevronLeft size={20} />
          {"\uC774\uC804 \uD398\uC774\uC9C0\uB85C"}
        </button>

        <div className="mb-10 overflow-hidden rounded-[2rem] border border-line bg-white shadow-lg shadow-stone-200/50">
          <div className="grid gap-0 lg:grid-cols-12">
            <div className="relative h-72 overflow-hidden bg-stone-100 md:h-80 lg:col-span-5 lg:h-[340px]">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={foundation.foundationName}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-amber-50 text-sm font-medium text-stone-400">
                  {"\uB2E8\uCCB4 \uB300\uD45C \uC774\uBBF8\uC9C0 \uC900\uBE44 \uC911"}
                </div>
              )}
            </div>
            <div className="space-y-5 p-8 lg:col-span-7 lg:p-10">
              {foundation.foundationType ? (
                <div className="inline-block rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                  {foundation.foundationType}
                </div>
              ) : null}
              <h1 className="text-3xl font-display font-bold text-ink md:text-4xl">{foundation.foundationName}</h1>
              <p className="line-clamp-3 text-base leading-relaxed text-stone-600">
                {foundation.description || "\uB4F1\uB85D\uB41C \uB2E8\uCCB4 \uC18C\uAC1C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-stone-400">{"\uC218\uC218\uB8CC"}</div>
                  <div className="mt-2 text-lg font-display font-bold text-primary">{formatFeeRate(foundation?.feeRate)}</div>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-stone-400">{"\uC804\uCCB4 \uCEA0\uD398\uC778"}</div>
                  <div className="mt-2 text-lg font-display font-bold text-ink">{campaigns.length}{"\uAC74"}</div>
                </div>
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-stone-400">{"\uC9C4\uD589\uC911 \uCEA0\uD398\uC778"}</div>
                  <div className="mt-2 text-lg font-display font-bold text-ink">{activeCampaignCount}{"\uAC74"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-12">
          <div className="space-y-10 lg:col-span-8">
            <section>
              <h2 className="mb-4 text-2xl font-display font-bold text-ink">{"\uB2E8\uCCB4 \uC18C\uAC1C"}</h2>
              <div className="rounded-[1.5rem] border border-line bg-white p-7">
                <p className="whitespace-pre-wrap text-base leading-relaxed text-stone-600">
                  {foundation.description || "\uB4F1\uB85D\uB41C \uB2E8\uCCB4 \uC18C\uAC1C\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}
                </p>
              </div>
            </section>

            <section>
              {campaigns.length === 0 ? (
                <div className="rounded-[1.5rem] border border-line bg-white p-10 text-center text-sm text-stone-500">
                  {"\uD604\uC7AC \uACF5\uAC1C\uB41C \uCEA0\uD398\uC778\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}
                </div>
              ) : (
                <div className="space-y-8">
                  <div>
                    <h3 className="mb-3 text-2xl font-display font-bold text-ink">{"\uC9C4\uD589\uC911\uC778 \uCEA0\uD398\uC778"}</h3>
                    {ongoingCampaigns.length > 0 ? (
                      <div className="space-y-4">{ongoingCampaigns.map((campaign) => renderCampaignCard(campaign))}</div>
                    ) : (
                      <div className="rounded-[1.25rem] border border-line bg-white p-6 text-sm text-stone-500">
                        {"\uD604\uC7AC \uC9C4\uD589\uC911\uC778 \uCEA0\uD398\uC778\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 text-2xl font-display font-bold text-ink">{"\uB9C8\uAC10\uB41C \uCEA0\uD398\uC778"}</h3>
                    {closedCampaigns.length > 0 ? (
                      <div className="space-y-4">{closedCampaigns.map((campaign) => renderCampaignCard(campaign))}</div>
                    ) : (
                      <div className="rounded-[1.25rem] border border-line bg-white p-6 text-sm text-stone-500">
                        {"\uB9C8\uAC10\uB41C \uCEA0\uD398\uC778\uC774 \uC5C6\uC2B5\uB2C8\uB2E4."}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              <section className="rounded-[1.5rem] border-2 border-line bg-white p-7">
                <h3 className="mb-5 text-xl font-display font-bold text-ink">{"\uC6B4\uC601 \uC815\uBCF4"}</h3>
                <div className="space-y-4 text-sm text-stone-600">
                  <div className="flex items-center justify-between">
                    <span>{"\uB300\uD45C\uC790"}</span>
                    <span className="font-bold text-ink">{foundation?.representativeName || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{"\uC774\uBA54\uC77C"}</span>
                    <span className="max-w-[65%] truncate text-right font-bold text-ink">{foundation?.foundationEmail || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{"\uC5F0\uB77D\uCC98"}</span>
                    <span className="font-bold text-ink">{foundation?.contactPhone || "-"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{"\uC0AC\uC5C5\uC790\uB4F1\uB85D\uBC88\uD638"}</span>
                    <span className="font-mono font-bold text-ink">{foundation?.businessRegistrationNumber || "-"}</span>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.5rem] border-2 border-line bg-white p-7">
                <h3 className="mb-5 text-xl font-display font-bold text-ink">{"\uC9C0\uAC11 \uC8FC\uC18C"}</h3>
                {wallet?.walletAddress ? (
                  <div className="space-y-4">
                    <div className="flex items-start gap-2 rounded-xl border border-line bg-surface p-3">
                      <Wallet size={16} className="mt-0.5 text-stone-400" />
                      <code className="break-all text-xs text-ink">{wallet.walletAddress}</code>
                    </div>
                    <button
                      type="button"
                      onClick={copyWallet}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line py-3 text-sm font-bold text-stone-600 transition-colors hover:border-primary/30 hover:text-primary"
                    >
                      <Copy size={14} />
                      {copied ? "\uBCF5\uC0AC \uC644\uB8CC" : "\uC8FC\uC18C \uBCF5\uC0AC"}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-stone-500">{"\uB4F1\uB85D\uB41C \uC9C0\uAC11 \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4."}</p>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
