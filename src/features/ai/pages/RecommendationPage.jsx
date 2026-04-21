import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Heart, ArrowRight, Loader2, BrainCircuit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { recommendationApi } from '../api/recommendationApi';

const RecommendationCard = ({ campaign }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="storybook-card group block p-0 bg-white overflow-hidden border-2 border-line rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500"
    >
      <Link to={`/campaign/${campaign.campaignNo}`} className="block">
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={campaign.imagePath || '/donation.jpg'}
            alt={campaign.title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute left-4 top-4">
            <div className="rounded-full border border-line bg-white/90 px-4 py-1.5 text-xs font-bold text-ink shadow-lg backdrop-blur-md">
              {campaign.category}
            </div>
          </div>
          {campaign.recommendationReason && (
            <div className="absolute bottom-0 left-0 right-0 bg-primary/90 backdrop-blur-sm p-3 text-white text-xs font-bold flex items-center gap-2">
              <Sparkles size={14} />
              {campaign.recommendationReason}
            </div>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-xl font-display font-bold leading-tight text-ink mb-4 group-hover:text-primary transition-colors line-clamp-2 min-h-[3rem]">
            {campaign.title}
          </h3>

          <div className="space-y-4">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-primary">{Math.round(campaign.achievementRate)}% 달성</span>
              <span className="text-stone-400">{campaign.currentAmount?.toLocaleString()}원 / {campaign.targetAmount?.toLocaleString()}원</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-stone-100 p-0.5 border border-line">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(campaign.achievementRate, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full rounded-full bg-primary shadow-sm"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-stone-50 py-3 font-bold text-stone-500 transition-all group-hover:bg-primary group-hover:text-white">
            자세히 보기 <ArrowRight size={16} />
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const RecommendationPage = () => {
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'search'
  const [historyRecommendations, setHistoryRecommendations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
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
  }, []);

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
    <div className="min-h-screen bg-[#FFFDFB] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary font-bold text-sm mb-6"
          >
            <BrainCircuit size={18} />
            AI 맞춤 캠페인 추천
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-display font-bold text-ink mb-6"
          >
            당신의 <span className="text-primary italic">따뜻한 마음</span>을<br />
            AI가 연결해 드립니다
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-stone-500 font-medium max-w-2xl mx-auto"
          >
            기부 내역을 분석한 맞춤 추천부터, 당신이 돕고 싶은 구체적인 이유까지.<br />
            가장 필요한 곳에 당신의 선행이 닿을 수 있도록 AI가 도와드려요.
          </motion.p>
        </div>

        {/* AI Search Box */}
        <div className="max-w-3xl mx-auto mb-20">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white border-4 border-line rounded-[2rem] p-2 shadow-xl">
              <div className="pl-6 pr-4 text-stone-400">
                <Search size={24} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="예: '어려운 환경에서 꿈을 키우는 아이들을 돕고 싶어요'"
                className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-medium text-ink placeholder:text-stone-300 py-4"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-primary text-white px-8 py-4 rounded-2xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                추천받기
              </button>
            </div>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mb-12">
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
          <button
            onClick={() => setActiveTab('search')}
            className={`px-8 py-3 rounded-full font-bold transition-all ${
              activeTab === 'search'
                ? 'bg-ink text-white shadow-lg'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            AI 검색 결과
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
              <p className="text-xl font-bold text-ink mb-2">AI가 캠페인을 분석하고 있어요</p>
              <p className="text-stone-500 font-medium">잠시만 기다려 주세요...</p>
            </motion.div>
          ) : activeTab === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {!isLoggedIn ? (
                <div className="bg-white border-4 border-line rounded-[2.5rem] p-16 text-center shadow-sm">
                  <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Heart size={40} className="text-stone-400" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-ink mb-4">로그인이 필요한 서비스입니다</h2>
                  <p className="text-stone-500 font-medium mb-10 max-w-md mx-auto">
                    회원님의 기부 패턴을 분석하여 맞춤 캠페인을 추천해 드려요.<br />
                    로그인하고 특별한 기부 제안을 만나보세요!
                  </p>
                  <Link to="/login" className="btn-fairytale px-12 py-4 inline-block">로그인하러 가기</Link>
                </div>
              ) : historyRecommendations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {historyRecommendations.map((campaign) => (
                    <RecommendationCard key={campaign.campaignNo} campaign={campaign} />
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
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {searchResults.map((campaign) => (
                    <RecommendationCard key={campaign.campaignNo} campaign={campaign} />
                  ))}
                </div>
              ) : (
                <div className="bg-white border-4 border-line rounded-[2.5rem] p-16 text-center shadow-sm">
                  <div className="w-20 h-20 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
                    <Search size={40} className="text-stone-400" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-ink mb-4">찾으시는 캠페인이 없나요?</h2>
                  <p className="text-stone-500 font-medium mb-10 max-w-md mx-auto">
                    도와주고 싶은 구체적인 이유나 상황을 입력해 보세요.<br />
                    AI가 최적의 매칭을 찾아드립니다.
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
