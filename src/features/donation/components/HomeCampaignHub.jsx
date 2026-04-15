import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, Flame, Sparkles, TrendingUp } from "lucide-react";
import childIcon from "../../../img/category/child.svg";
import seniorIcon from "../../../img/category/senior.svg";
import disabledIcon from "../../../img/category/disabled.svg";
import animalIcon from "../../../img/category/animal.svg";
import environmentIcon from "../../../img/category/environment.svg";
import etcIcon from "../../../img/category/etc.svg";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
const HOME_HUB_CACHE_KEY = "donation-home-hub-cache-v1";
const HOME_HUB_CACHE_TTL_MS = 60 * 1000;

const EMPTY_SUMMARY = {
  totalDonationCount: 0,
  totalUserCount: 0,
  totalCampaignCount: 0
};

const QUICK_CATEGORIES = [
  { label: "아동/청소년", icon: childIcon },
  { label: "어르신", icon: seniorIcon },
  { label: "장애인", icon: disabledIcon },
  { label: "동물", icon: animalIcon },
  { label: "환경", icon: environmentIcon },
  { label: "기타", icon: etcIcon }
];
const LIVE_DONOR_NAMES = ["김*후", "이**", "박*준", "최**", "정**", "한**", "윤**", "익명"];

function formatCount(value, unit = "") {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${safe.toLocaleString("ko-KR")}${unit}`;
}

function formatWon(value) {
  const safe = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${safe.toLocaleString("ko-KR")}원`;
}

function formatElapsed(seconds) {
  const safe = Math.max(0, Number(seconds) || 0);
  if (safe < 60) return `${safe}초 전`;
  const minutes = Math.floor(safe / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  return `${hours}시간 전`;
}

function normalizeImagePath(imagePath) {
  if (!imagePath) {
    return "";
  }

  const rawPath = String(imagePath).trim();
  if (!rawPath) {
    return "";
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
    return "";
  }

  if (!API_BASE_URL) {
    return rawPath;
  }

  return rawPath.startsWith("/") ? `${API_BASE_URL}${rawPath}` : `${API_BASE_URL}/${rawPath}`;
}

function toCampaignCard(item) {
  const id = Number(item?.campaignNo ?? item?.id ?? 0);
  const raised = Number(item?.currentAmount ?? item?.raised ?? 0);
  const goal = Number(item?.targetAmount ?? item?.goal ?? 0);
  const progress = Number(item?.progressPercent ?? item?.progress ?? 0);

  return {
    id: Number.isFinite(id) ? id : 0,
    image: normalizeImagePath(item?.imagePath || item?.image || ""),
    shortTitle: item?.title || item?.shortTitle || "",
    summary: item?.foundationName || "",
    category: item?.category || "기타",
    progress: Number.isFinite(progress) ? progress : 0,
    raised: Number.isFinite(raised) ? raised : 0,
    goal: Number.isFinite(goal) ? goal : 0,
    daysLeft: item?.daysLeft ?? null,
    endDate: item?.endAt ?? item?.endDate ?? null
  };
}

function toHomeState(data) {
  const soonList = Array.isArray(data?.endingSoon) ? data.endingSoon.map(toCampaignCard) : [];
  const topList = Array.isArray(data?.topParticipation) ? data.topParticipation.map(toCampaignCard) : [];
  const merged = [...soonList, ...topList];
  const uniqueCampaigns = Array.from(new Map(merged.map((item) => [item.id, item])).values());

  return {
    summary: {
      totalDonationCount: Number(data?.totalDonationCount ?? 0),
      totalUserCount: Number(data?.totalUserCount ?? 0),
      totalCampaignCount: Number(data?.totalCampaignCount ?? 0)
    },
    endingSoon: soonList,
    topProgress: topList,
    campaigns: uniqueCampaigns
  };
}
function getDdayLabel(campaign) {
  const directDaysLeft = Number(campaign?.daysLeft);
  if (Number.isFinite(directDaysLeft)) {
    if (directDaysLeft < 0) return "종료";
    if (directDaysLeft === 0) return "D-Day";
    return `D-${directDaysLeft}`;
  }

  if (!campaign?.endDate) {
    return "";
  }

  const now = new Date();
  const end = new Date(campaign.endDate);
  if (Number.isNaN(end.getTime())) {
    return "";
  }

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  const diff = Math.ceil((endDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return "종료";
  if (diff === 0) return "D-Day";
  return `D-${diff}`;
}

function CampaignCard({ campaign, showDeadlinePill = false }) {
  const ddayLabel = showDeadlinePill ? getDdayLabel(campaign) : "";

  return (
    <Link
      to={`/campaign/${campaign.id}`}
      className="group block overflow-hidden rounded-[2rem] border-2 border-line bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={campaign.image}
          alt={campaign.shortTitle}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {ddayLabel ? (
          <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white shadow-sm">
            {ddayLabel}
          </span>
        ) : null}
      </div>
      <div className="p-6">
        <div className="mb-3 flex items-center justify-between text-xs font-bold text-stone-400">
          <span>{campaign.category}</span>
          <span>{campaign.progress}%</span>
        </div>
        <h3 className="line-clamp-2 text-xl font-display font-bold text-ink">{campaign.shortTitle}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-stone-500">{campaign.summary}</p>
        <div className="mt-4 flex items-end justify-between">
          <span className="text-primary font-bold">{formatWon(campaign.raised)}</span>
          <span className="text-xs text-stone-400">목표 {formatWon(campaign.goal)}</span>
        </div>
      </div>
    </Link>
  );
}

export default function HomeCampaignHub() {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [endingSoon, setEndingSoon] = useState([]);
  const [topProgress, setTopProgress] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [nowTs, setNowTs] = useState(Date.now());

  useEffect(() => {
    let ignore = false;
    let controller = null;

    function applyHomeState(homeState) {
      setSummary(homeState.summary);
      setEndingSoon(homeState.endingSoon);
      setTopProgress(homeState.topProgress);
      setCampaigns(homeState.campaigns);
    }

    function readCache() {
      try {
        const raw = sessionStorage.getItem(HOME_HUB_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        const age = Date.now() - Number(parsed?.savedAt ?? 0);
        if (age < 0 || age > HOME_HUB_CACHE_TTL_MS) return null;
        return parsed?.payload ?? null;
      } catch {
        return null;
      }
    }

    function writeCache(payload) {
      try {
        sessionStorage.setItem(
          HOME_HUB_CACHE_KEY,
          JSON.stringify({ savedAt: Date.now(), payload })
        );
      } catch {
        // ignore cache errors
      }
    }

    async function loadFallbackHub() {
      const [statsRes, campaignsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/donation/public/stats`),
        fetch(`${API_BASE_URL}/api/foundation/campaigns?sort=deadline`)
      ]);

      if (!statsRes.ok || !campaignsRes.ok) {
        throw new Error("fallback request failed");
      }

      const [stats, campaignListRaw] = await Promise.all([statsRes.json(), campaignsRes.json()]);
      const campaignList = Array.isArray(campaignListRaw) ? campaignListRaw.map(toCampaignCard) : [];
      const payload = {
        totalDonationCount: Number(stats?.totalDonationCount ?? 0),
        totalUserCount: Number(stats?.totalUserCount ?? 0),
        totalCampaignCount: Number(stats?.totalCampaignCount ?? 0),
        endingSoon: campaignList.slice(0, 2),
        topParticipation: [...campaignList].sort((a, b) => b.progress - a.progress).slice(0, 3)
      };

      return toHomeState(payload);
    }

    async function loadHomeHub() {
      let timeoutId = null;
      try {
        controller = new AbortController();
        timeoutId = setTimeout(() => controller?.abort(), 1500);
        const response = await fetch(`${API_BASE_URL}/api/donation/public/home-hub`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`home-hub request failed: ${response.status}`);
        }

        const data = await response.json();
        const homeState = toHomeState(data);
        if (!ignore) {
          applyHomeState(homeState);
          writeCache(data);
        }
      } catch {
        try {
          const fallback = await loadFallbackHub();
          if (!ignore) {
            applyHomeState(fallback);
            writeCache({
              totalDonationCount: fallback.summary.totalDonationCount,
              totalUserCount: fallback.summary.totalUserCount,
              totalCampaignCount: fallback.summary.totalCampaignCount,
              endingSoon: fallback.endingSoon,
              topParticipation: fallback.topProgress
            });
          }
        } catch {
          if (!ignore) {
            setSummary(EMPTY_SUMMARY);
            setEndingSoon([]);
            setTopProgress([]);
            setCampaigns([]);
          }
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      }
    }

    const cached = readCache();
    if (cached && !ignore) {
      applyHomeState(toHomeState(cached));
    }

    loadHomeHub();

    return () => {
      ignore = true;
      controller?.abort();
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalRaisedAmount = useMemo(
    () =>
      campaigns.reduce((sum, item) => {
        const amount = Number(item?.raised ?? 0);
        return sum + (Number.isFinite(amount) ? amount : 0);
      }, 0),
    [campaigns]
  );

  const feedItems = useMemo(() => {
    return campaigns.slice(0, 5).map((item, index) => {
      const base = Number(item?.raised ?? 0);
      const derivedAmount = Math.max(1000, ((base % 120000) + 10000));
      const roundedAmount = Math.round(derivedAmount / 1000) * 1000;
      return {
        id: item.id || index,
        name: LIVE_DONOR_NAMES[(Number(item?.id ?? index) + index) % LIVE_DONOR_NAMES.length],
        amount: roundedAmount,
        campaignTitle: item.shortTitle || "캠페인",
        donatedAt: Date.now() - (8 + index * 13) * 1000
      };
    });
  }, [campaigns]);

  return (
    <section id="home-hub" className="home-snap-target bg-white pt-28 pb-16 md:pt-32 md:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[2rem] border border-primary/20 bg-primary px-8 py-7 text-white shadow-lg shadow-primary/20">
            <p className="text-sm font-bold text-white/80">누적 기부 금액</p>
            <p className="mt-3 text-4xl font-display font-bold">{formatWon(totalRaisedAmount)}</p>
          </div>
          <div className="rounded-[2rem] border border-line bg-ink px-8 py-7 text-white shadow-lg">
            <p className="text-sm font-bold text-white/70">함께한 기부자들</p>
            <p className="mt-3 text-4xl font-display font-bold">{formatCount(summary.totalUserCount, "명")}</p>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-2xl font-display font-bold text-ink">
                <Flame size={20} className="text-primary" />
                마감 임박 캠페인
              </h3>
              <Link to="/campaigns" className="text-sm font-bold text-primary hover:underline">전체보기</Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              {endingSoon.map((item) => (
                <CampaignCard key={`soon-${item.id}`} campaign={item} showDeadlinePill />
              ))}
            </div>

            <div className="mt-10 mb-5 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-2xl font-display font-bold text-ink">
                <TrendingUp size={20} className="text-primary" />
                참여율 높은 캠페인
              </h3>
              <Link to="/campaigns" className="text-sm font-bold text-primary hover:underline">전체보기</Link>
            </div>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {topProgress.map((item) => (
                <CampaignCard key={`top-${item.id}`} campaign={item} />
              ))}
            </div>
          </div>

          <aside className="lg:col-span-4">
            <div className="rounded-[2rem] border-2 border-line bg-white p-6 shadow-sm">
              <h4 className="mb-5 flex items-center gap-2 text-xl font-display font-bold text-ink">
                <Sparkles size={16} className="text-primary" /> 카테고리별 찾기
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {QUICK_CATEGORIES.map((item) => (
                  <Link
                    key={item.label}
                    to={`/campaigns?category=${encodeURIComponent(item.label)}`}
                    className="rounded-2xl border border-line bg-[#FFFDFB] p-3 text-center transition-all hover:border-primary/40"
                  >
                    <img src={item.icon} alt={item.label} className="mx-auto h-8 w-8 object-contain" loading="lazy" />
                    <p className="mt-2 text-xs font-bold text-ink">{item.label}</p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] border-2 border-line bg-white p-6 shadow-sm">
              <h4 className="mb-4 flex items-center gap-2 text-xl font-display font-bold text-ink">
                <Bell size={16} className="text-primary" /> 실시간 소식
              </h4>
              <ul className="space-y-3">
                {feedItems.map((item) => (
                  <li key={item.id} className="rounded-xl bg-[#FFF9F5] px-3 py-2">
                    <p className="line-clamp-1 text-sm font-bold text-ink">{item.name}님이 {formatWon(item.amount)} 기부</p>
                    <p className="text-xs text-stone-500">
                      {formatElapsed(Math.floor((nowTs - item.donatedAt) / 1000))} · {item.campaignTitle}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

