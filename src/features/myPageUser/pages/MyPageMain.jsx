import { useEffect, useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import WalletCard from "../components/MyWalletCard";
import DonationSummaryCard from "../components/MyDonationSummaryCard";
import DonationHistorySection from "../components/DonationHistorySection";
import MicroTrackingModal from "../components/MicroTrackingModal";
import "../styles/MyPage.css";
import {
  getTransactionHistory,
  getWalletInfo,
  getMicroTracking,
} from "../api/mypageApi";

export default function MyPageMain() {
  const navigate = useNavigate();
  const { myInfo } = useOutletContext();

  const [walletInfo, setWalletInfo] = useState(null);
  const [transactionList, setTransactionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isTrackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [isTrackingLoading, setTrackingLoading] = useState(false);

  const handleOpenTrackingModal = async (campaignNo) => {
    if (!campaignNo) return;
    setTrackingLoading(true);
    setTrackingModalOpen(true);
    try {
      const res = await getMicroTracking(campaignNo);
      setTrackingData(res.data);
      console.log(res.data);
    } catch (error) {
      console.error("Failed to fetch micro tracking data", error);
      setTrackingData(null); // Clear previous data on error
    } finally {
      setTrackingLoading(false);
    }

  };

  const handleCloseTrackingModal = () => {
    setTrackingModalOpen(false);
    setTrackingData(null);
  };
  
  // 로그인 여부 확인용 헬퍼 함수
  const getIsLoggedIn = () => {
    const cookies = document.cookie.split(';');
    const hasCookieToken = cookies.some(cookie => cookie.trim().startsWith('accessToken='));
    const hasLocalStorageToken = !!localStorage.getItem('accessToken');
    return hasCookieToken || hasLocalStorageToken;
  };

  useEffect(() => {
    // 1. 로그인 여부 즉시 확인
    if (!getIsLoggedIn()) {
      alert("로그아웃되었습니다. 다시 로그인해주세요.");
      navigate("/login", { replace: true });
      return;
    }

    // 2. 데이터 불러오기
    fetchMyPageData();
  }, [navigate]);

  const fetchMyPageData = async () => {
    try {
      setLoading(true);
      setError("");

      const [walletRes, transactionRes] = await Promise.all([
        getWalletInfo(),
        getTransactionHistory(),
      ]);

      setWalletInfo(walletRes.data);
      setTransactionList(transactionRes.data ?? []);
    } catch (err) {
      console.error(err);
      setError("마이페이지 정보를 불러오지 못했어.");
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    if (!transactionList.length) {
      return {
        transactionNum: 0,
        totalAmount: 0,
      };
    }

    return {
      transactionNum: transactionList[0]?.transactionNum ?? 0,
      totalAmount: transactionList[0]?.total_amount ?? 0,
    };
  }, [transactionList]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-display text-xl text-ink">로딩 중...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center font-display text-xl text-ink">{error}</div>;
  }

  return (
    <>
      <div className="flex-1 min-w-0 space-y-12">
        {/* 제목 */}
        <header className="mb-12 relative">
          <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-1.5 h-16 bg-primary rounded-full hidden lg:block" />
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-orange-100 text-primary text-[10px] font-black uppercase tracking-widest">
              Member Dashboard
            </span>
          </div>
          <h1 className="text-5xl font-black text-ink tracking-tight !mb-0 !text-left">
            반가워요, <span className="text-primary">{myInfo?.name || "사용자"}</span>님!
          </h1>
          <p className="text-ink/40 mt-4 text-lg font-medium">
            오늘도 따뜻한 마음을 나눠주셔서 감사합니다.
          </p>
        </header>

        {/* 1단: 지갑 정보 */}
        <div className="w-full">
          <WalletCard walletInfo={walletInfo} />
        </div>

        {/* 2단: 요약 & 기부내역 */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-stretch">
          <div className="xl:col-span-4">
            <DonationSummaryCard summary={summary} />
          </div>
          <div className="xl:col-span-8">
            <DonationHistorySection
              donationHistory={transactionList}
              onViewAll={() => navigate("/mypage/donation-history")}
              onOpenTracking={handleOpenTrackingModal}
            />
          </div>
        </div>
      </div>
      <MicroTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={handleCloseTrackingModal}
        trackingData={trackingData}
        isLoading={isTrackingLoading}
      />
    </>
  );
}