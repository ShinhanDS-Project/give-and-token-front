import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Calendar, ReceiptText, Search } from "lucide-react";
import "../styles/MyPage.css";
import { getTransactionHistory, getMicroTracking } from "../api/mypageApi";
import MicroTrackingModal from "../components/MicroTrackingModal";

export default function MyPageDonationHistory() {
  const navigate = useNavigate();

  const [transactionList, setTransactionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isTrackingModalOpen, setTrackingModalOpen] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [isTrackingLoading, setTrackingLoading] = useState(false);

  useEffect(() => {
    fetchDonationHistory();
  }, []);

  const fetchDonationHistory = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getTransactionHistory();
      setTransactionList(response.data ?? []);
    } catch (err) {
      console.error(err);
      setError("기부내역을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTrackingModal = async (campaignNo) => {
    if (!campaignNo) return;
    setTrackingLoading(true);
    setTrackingModalOpen(true);
    try {
      const res = await getMicroTracking(campaignNo);
      setTrackingData(res.data);
    } catch (error) {
      console.error("Failed to fetch micro tracking data", error);
      setTrackingData(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleCloseTrackingModal = () => {
    setTrackingModalOpen(false);
    setTrackingData(null);
  };

  const formatAmount = (donationAmount) => {
    if (donationAmount == null) return "0원";
    return `${Number(donationAmount).toLocaleString()}원`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return "-";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue;
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-display text-xl text-ink">기부내역 불러오는 중...</div>;
  }

  return (
    <div className="mypage-sub-page scrollbar-hide">
      <div className="max-w-4xl mx-auto scrollbar-hide">
        <header className="flex items-center gap-4 mb-12">
          <button 
            className="p-3 bg-white rounded-full shadow-md hover:scale-110 transition-transform text-primary border border-slate-100"
            onClick={() => navigate("/mypage")}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="!mb-0 !text-left">나의 후원 내역</h1>
        </header>

        {transactionList.length === 0 ? (
          <section className="mypage-card py-24 text-center">
            <p className="text-slate-300 font-bold">후원 내역이 없습니다.</p>
          </section>
        ) : (
          <div className="flex flex-col gap-6">
            {transactionList.map((item, index) => (
              <section 
                key={item.transaction?.transactionNo ?? `${item.campaignNo}-${index}`}
                className="bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group relative overflow-hidden"
              >
                {/* 배경 데코레이션 */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                
                <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                  {/* 1. 캠페인 정보 섹션 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-wider border border-slate-100">
                        Campaign
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-ink mb-4 leading-tight group-hover:text-primary transition-colors line-clamp-2">
                      {item.title ?? "-"}
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-stone-400 font-bold text-xs">
                        <Calendar size={14} className="text-primary/40" />
                        {formatDate(item.transaction?.sentAt || item.transaction?.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* 2. 후원 금액 섹션 (중앙 강조) */}
                  <div className="lg:px-12 lg:border-x border-slate-100 flex flex-col items-start lg:items-center justify-center min-w-[180px]">
                    <p className="text-[10px] font-black text-stone-300 uppercase tracking-[0.2em] mb-2">Amount Donated</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-ink tracking-tight">
                        {Number(item.priceamount || 0).toLocaleString()}
                      </span>
                      <span className="text-lg font-bold text-stone-400">원</span>
                    </div>
                  </div>

                  {/* 3. 액션 버튼 섹션 (우측 스택) */}
                  <div className="shrink-0 flex flex-col gap-2 w-full lg:w-48">
                    <button
                      onClick={() => handleOpenTrackingModal(item.campaignNo)}
                      className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-2xl text-xs font-black hover:bg-primary-dark hover:-translate-y-0.5 transition-all shadow-lg shadow-primary/20"
                    >
                      <Search size={14} />
                      마이크로 트래킹 확인
                    </button>
                    
                    {item.transaction?.txHash && (
                      <a 
                        href={`/blockchain/transactions/${item.transaction.txHash}`}
                        className="flex items-center justify-center gap-2 bg-slate-50 text-slate-500 px-5 py-3 rounded-2xl text-xs font-bold hover:bg-slate-100 hover:text-primary transition-all border border-slate-100"
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ReceiptText size={14} />
                        블록체인 증명서 확인
                        <ExternalLink size={12} className="opacity-40" />
                      </a>
                    )}
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <MicroTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={handleCloseTrackingModal}
        trackingData={trackingData}
        isLoading={isTrackingLoading}
      />
    </div>
  );
}
