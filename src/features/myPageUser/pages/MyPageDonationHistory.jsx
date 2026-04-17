import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Calendar, ReceiptText } from "lucide-react";
import "../styles/MyPage.css";
import { getTransactionHistory } from "../api/mypageApi";

export default function MyPageDonationHistory() {
  const navigate = useNavigate();

  const [transactionList, setTransactionList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const formatAmount = (amount) => {
    if (amount == null) return "0원";
    return `${Number(amount).toLocaleString()}원`;
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
    <div className="mypage-main-page">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center gap-4 mb-12">
          <button 
            className="p-3 bg-white rounded-full shadow-md hover:scale-110 transition-transform text-primary border border-slate-100"
            onClick={() => navigate("/mypage")}
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="!mb-0 !text-left">전체 후원 내역</h1>
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
                className="mypage-card hover:border-primary/30"
              >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-7">
                    <p className="card-label-clean">Campaign</p>
                    <h3 className="text-2xl font-bold text-ink mb-4">{item.title ?? "-"}</h3>
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-xl text-xs font-bold text-ink/40">
                        <Calendar size={14} />
                        {formatDate(item.transaction?.sentAt || item.transaction?.createdAt)}
                      </div>
                      <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-xl text-xs font-bold text-ink/20 uppercase tracking-tighter">
                        ID-{item.campaignNo ?? "-"}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5 flex flex-col md:items-end gap-3">
                    <p className="card-label-clean md:text-right">Donation Amount</p>
                    <p className="text-3xl font-black text-ink">{formatAmount(item.amount)}</p>
                    <div className="flex items-center gap-3 mt-2">
                       <span className={`status-tag-clean ${
                        item.transaction?.status === 'SUCCESS' ? 'text-emerald-500 border-emerald-100' : 
                        item.transaction?.status === 'PENDING' ? 'text-amber-500 border-amber-100' : 'text-rose-500 border-rose-100'
                      }`}>
                        • {item.transaction?.status ?? "PENDING"}
                      </span>
                      
                      {item.transaction?.txHash && (
                         <a 
                          href={`/blockchain/transactions/${item.transaction.txHash}`}
                          className="text-primary hover:underline flex items-center gap-1 text-xs font-bold"
                          target="_blank"
                          rel="noreferrer"
                         >
                           블록체인 증명 <ExternalLink size={12} />
                         </a>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
