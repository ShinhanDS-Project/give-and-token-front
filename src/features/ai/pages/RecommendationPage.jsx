import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Heart, Loader2, BrainCircuit, BookOpen, Droplets, HeartPulse, Leaf, PawPrint } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { recommendationApi } from '../api/recommendationApi';
import noResultImage from '../../../img/noResult.png';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const FALLBACK_CAMPAIGN_IMAGE = '/donation.jpg';
const CAMPAIGN_LIST_API = '/api/foundation/campaigns';
const CATEGORY_META = {
  '아동/청소년': {
    icon: BookOpen,
    color: 'text-primary',
    badgeClass: 'border-rose-200 bg-rose-50/95 text-rose-600'
  },
  '어르신': {
    icon: Droplets,
    color: 'text-blue-400',
    badgeClass: 'border-sky-200 bg-sky-50/95 text-sky-600'
  },
  장애인: {
    icon: HeartPulse,
    color: 'text-secondary',
    badgeClass: 'border-violet-200 bg-violet-50/95 text-violet-600'
  },
  동물: {
    icon: PawPrint,
    color: 'text-amber-500',
    badgeClass: 'border-amber-200 bg-amber-50/95 text-amber-700'
  },
  환경: {
    icon: Leaf,
    color: 'text-emerald-500',
    badgeClass: 'border-emerald-200 bg-emerald-50/95 text-emerald-700'
  },
  기타: {
    icon: Sparkles,
    color: 'text-primary',
    badgeClass: 'border-stone-200 bg-white/95 text-stone-600'
  }
};

function normalizeCategory(value) {
  const text = String(value || '').trim().toLowerCase();

  if (!text) return '기타';
  if (text.includes('child') || text.includes('youth') || text.includes('아동') || text.includes('청소년')) return '아동/청소년';
  if (text.includes('senior') || text.includes('elder') || text.includes('old') || text.includes('어르신') || text.includes('노인')) return '어르신';
  if (text.includes('disabled') || text.includes('장애')) return '장애인';
  if (text.includes('animal') || text.includes('동물')) return '동물';
  if (text.includes('environment') || text.includes('env') || text.includes('지구') || text.includes('환경')) return '환경';

  return '기타';
}

function normalizeImagePath(imagePath) {
  if (!imagePath) return FALLBACK_CAMPAIGN_IMAGE;

  const rawPath = String(imagePath).trim();
  if (!rawPath) return FALLBACK_CAMPAIGN_IMAGE;
  if (/^(https?:\/\/|data:image\/|blob:)/i.test(rawPath)) return rawPath;

  const noFileScheme = rawPath.replace(/^file:(\/\/\/|\/\/)?/i, '');
  const normalized = noFileScheme.replace(/\\/g, '/');
  const uploadMatch = normalized.match(/(?:^|\/)uploads\/(.+)$/i);
  if (uploadMatch) {
    const uploadPath = `/uploads/${uploadMatch[1].replace(/^\/+/, '')}`;
    return API_BASE_URL ? `${API_BASE_URL}${uploadPath}` : uploadPath;
  }

  if (/^[a-zA-Z]:\//.test(normalized)) return FALLBACK_CAMPAIGN_IMAGE;
  if (!API_BASE_URL) return rawPath;
  return rawPath.startsWith('/') ? `${API_BASE_URL}${rawPath}` : `${API_BASE_URL}/${rawPath}`;
}

function extractCampaignItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function getCampaignImageSource(campaign, campaignImageMap = {}) {
  const mappedImage = campaignImageMap?.[campaign?.campaignNo];
  const rawImage =
    campaign?.imagePath ||
    campaign?.image ||
    campaign?.imageUrl ||
    campaign?.thumbnail ||
    mappedImage ||
    '';

  return normalizeImagePath(rawImage);
}

function getCampaignEndTime(campaign) {
  const rawEndDate =
    campaign?.endAt ??
    campaign?.endDate ??
    campaign?.endDatetime ??
    campaign?.deadline ??
    null;

  if (!rawEndDate) return null;

  const endTime = new Date(rawEndDate).getTime();
  if (Number.isNaN(endTime)) return null;

  return endTime;
}

function isClosedCampaign(campaign) {
  const endTime = getCampaignEndTime(campaign);
  if (endTime === null) return false;

  return endTime < Date.now();
}

const RecommendationCard = ({ campaign, campaignImageMap }) => {
  const progress = Math.min(Math.max(Math.round(campaign.achievementRate || 0), 0), 100);
  const normalizedCategory = normalizeCategory(campaign.category);
  const categoryMeta = CATEGORY_META[normalizedCategory] || CATEGORY_META.기타;
  const CategoryIcon = categoryMeta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative pt-[86px]"
    >
      {campaign.recommendationReason && (
        <div className="absolute left-0 right-0 top-0 z-20 group/reason">
          <div className="w-full rounded-[1.2rem] border border-primary/25 bg-[#FFF4EF] px-4 py-3 text-xs font-bold text-primary flex items-start gap-2 text-left transition-all duration-200">
            <Sparkles size={14} className="shrink-0 mt-0.5" />
            <span className="block overflow-hidden max-h-10 leading-5 line-clamp-2 transition-all duration-200 group-hover/reason:max-h-56 group-hover/reason:line-clamp-none">
              {campaign.recommendationReason}
            </span>
          </div>
        </div>
      )}

      <Link
        to={`/campaign/${campaign.campaignNo}`}
        className="group block rounded-[2.2rem] border-2 border-[#F2DAD3] bg-white p-0 transition-all duration-300 hover:-translate-y-1 hover:border-[#F0B5A3] hover:shadow-[0_12px_24px_-14px_rgba(242,140,109,0.35)]"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-[#F7F7F5]">
          <img
            src={getCampaignImageSource(campaign, campaignImageMap)}
            alt={campaign.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.1] sepia-[0.05]"
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (e.currentTarget.src.includes(FALLBACK_CAMPAIGN_IMAGE)) return;
              e.currentTarget.src = FALLBACK_CAMPAIGN_IMAGE;
            }}
          />
          <div className="absolute top-5 left-5">
            <div
              className={`backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg border ${categoryMeta.badgeClass}`}
            >
              {normalizedCategory}
            </div>
          </div>
        </div>

        <div className="px-10 pb-10 pt-7">
          <div className="flex items-start gap-4 mb-8">
            <div className={`mt-1 w-12 h-12 rounded-2xl bg-stone-50 flex items-center justify-center ${categoryMeta.color}`}>
              <CategoryIcon size={24} />
            </div>
            <div className="min-w-0">
              <h3 className="text-2xl font-display font-bold text-ink leading-tight group-hover:text-primary transition-colors line-clamp-2">
                {campaign.title}
              </h3>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-primary">{progress}% 달성</span>
              <span className={isClosedCampaign(campaign) ? 'text-stone-500' : 'text-emerald-600'}>
                {isClosedCampaign(campaign) ? '마감' : '모집중'}
              </span>
            </div>
            <div className="h-3 rounded-full overflow-hidden border border-line bg-stone-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-primary"
              />
            </div>
            <div className="text-xs text-stone-400 text-right font-bold">
              목표액 {campaign.targetAmount?.toLocaleString() || 0}원
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const RecommendationPage = () => {
  const [activeTab, setActiveTab] = useState('search'); // 'history' or 'search'
  const [historyRecommendations, setHistoryRecommendations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [campaignImageMap, setCampaignImageMap] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
    
    if (token) {
        fetchHistoryRecommendations();
    }

    fetchCampaignImageMap();
  }, []);

  const fetchCampaignImageMap = async () => {
    try {
      const map = {};
      let page = 1;
      const size = 100;
      let hasNext = true;

      while (hasNext) {
        const query = new URLSearchParams({
          page: String(page),
          size: String(size),
          sort: 'deadline',
          includeClosed: 'true'
        });
        const response = await fetch(`${CAMPAIGN_LIST_API}?${query.toString()}`);
        if (!response.ok) break;

        const data = await response.json();
        const items = extractCampaignItems(data);

        items.forEach((item) => {
          const campaignNo = Number(item?.campaignNo || item?.id || 0);
          const imagePath = item?.imagePath || item?.image || item?.imageUrl || '';
          if (campaignNo > 0 && imagePath) {
            map[campaignNo] = imagePath;
          }
        });

        const pageInfo = data?.pageInfo;
        hasNext = Boolean(pageInfo?.hasNext);
        page += 1;

        if (!Array.isArray(items) || items.length === 0) {
          break;
        }
      }

      setCampaignImageMap(map);
    } catch (e) {
      console.warn('campaign image map load failed', e);
    }
  };

  const fetchHistoryRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await recommendationApi.getRecommendations();
      setHistoryRecommendations(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await recommendationApi.searchByReason(searchQuery);
      setSearchResults(data);
      setActiveTab('search');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDFB] pt-40 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary font-bold text-sm mb-6"
          >
            <BrainCircuit size={18} />
            <span className="font-sans">AI</span> 맞춤 캠페인 추천
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-display font-bold text-ink mb-10"
          >
            당신의 <span className="text-primary italic">따뜻한 마음</span>을<br />
            <span className="font-sans not-italic">AI</span>가 연결해 드립니다
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl text-stone-500 font-[450] max-w-2xl mx-auto font-display"
          >
            기부 내역을 분석한 맞춤 추천부터, 당신이 돕고 싶은 구체적인 이유까지.<br />
            가장 필요한 곳에 당신의 선행이 닿을 수 있도록 <span className="font-sans">AI</span>가 도와드려요.
          </motion.p>
        </div>

        {/* AI Search Box */}
        <div className="max-w-4xl mx-auto mb-20">
          <form onSubmit={handleSearch}>
            <div className="flex items-stretch overflow-hidden rounded-full border-2 border-primary/25 bg-white">
              <div className="shrink-0 grid w-16 place-items-center text-stone-400">
                <Search size={24} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="예: '어려운 환경에서 꿈을 키우는 아이들을 돕고 싶어요'"
                className="w-full border-none bg-transparent py-3.5 pr-5 text-base font-semibold text-ink placeholder:text-stone-400 caret-primary outline-none focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="shrink-0 inline-flex min-w-[120px] items-center justify-center gap-2 self-stretch rounded-none rounded-r-full border-none border-l border-primary/20 bg-[#FFF7F1] px-4 py-3.5 text-primary outline-none transition-colors hover:bg-primary/10 focus:outline-none focus:ring-0 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Sparkles size={20} strokeWidth={2.8} className="text-primary" />
                )}
                <span className="font-black tracking-tight text-primary">추천받기</span>
              </button>
            </div>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-12">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-8 py-3 rounded-full font-bold transition-all ${
              activeTab === 'search'
                ? 'bg-ink text-white shadow-lg'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            <span className="font-sans">AI</span> 검색 결과
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-8 py-3 rounded-full font-bold transition-all ${
              activeTab === 'history'
                ? 'bg-ink text-white shadow-lg'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            기부 패턴 분석 추천
          </button>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                <BrainCircuit size={40} className="text-primary" />
              </div>
              <p className="text-xl font-bold text-ink mb-2"><span className="font-sans">AI</span>가 캠페인을 분석하고 있어요</p>
              <p className="text-stone-500 font-medium">잠시만 기다려 주세요...</p>
            </motion.div>
          ) : activeTab === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {!isLoggedIn ? (
                <div className="py-8 text-center">
                  <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Heart size={40} className="text-stone-400" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-ink mb-4">로그인이 필요한 서비스입니다</h2>
                  <p className="text-stone-500 font-medium mb-10 max-w-md mx-auto">
                    회원님의 기부 패턴을 분석하여 맞춤 캠페인을 추천해 드려요.<br />
                    로그인하고 특별한 기부 제안을 만나보세요!
                  </p>
                  <Link to="/login" className="btn-fairytale !inline-flex !px-5 !py-3 text-base">로그인하러 가기</Link>
                </div>
              ) : historyRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {historyRecommendations.map((campaign) => (
                    <RecommendationCard key={campaign.campaignNo} campaign={campaign} campaignImageMap={campaignImageMap} />
                  ))}
                </div>
              ) : (
                <div className="bg-white border-4 border-line rounded-[2.5rem] p-16 text-center shadow-sm">
                  <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Sparkles size={40} className="text-stone-400" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-ink mb-4">아직 기부 내역이 없으시군요?</h2>
                  <p className="text-stone-500 font-medium mb-10 max-w-md mx-auto">
                    첫 기부를 시작하시면 회원님의 성향을 분석하여<br />
                    더 정교한 추천을 드릴 수 있습니다.
                  </p>
                  <Link to="/campaigns" className="btn-fairytale px-12 py-4 inline-block">캠페인 둘러보기</Link>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {searchResults.map((campaign) => (
                    <RecommendationCard key={campaign.campaignNo} campaign={campaign} campaignImageMap={campaignImageMap} />
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-8 h-40 w-40 overflow-hidden">
                    <img
                      src={noResultImage}
                      alt="검색 결과 없음"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-ink mb-4">찾으시는 캠페인이 없나요?</h2>
                  <p className="text-stone-500 font-medium mb-10 max-w-md mx-auto">
                    도와주고 싶은 구체적인 이유나 상황을 입력해 보세요.<br />
                    <span className="font-sans">AI</span>가 최적의 매칭을 찾아드립니다.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RecommendationPage;
