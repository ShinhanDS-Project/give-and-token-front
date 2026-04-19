import { ChevronRight, ExternalLink, Calendar, ReceiptText } from "lucide-react";

function formatAmount(amount) {
  if (amount == null) return "0원";
  return `${Number(amount).toLocaleString()}원`;
}

function formatDate(dateValue) {
  if (!dateValue) return "-";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function DonationHistorySection({
  donationHistory = [],
  onViewAll,
  onOpenTracking,
}) {
  return (
    <section className="mypage-card">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-2 text-ink">
          <ReceiptText size={20} className="text-stone-400" />
          <h3 className="text-xl font-bold">최근 후원 활동</h3>
        </div>
        <button 
          type="button" 
          onClick={onViewAll}
          className="text-sm font-bold text-stone-400 hover:text-primary transition-colors flex items-center gap-1 group"
        >
          기록 전체보기
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      {donationHistory.length === 0 ? (
        <div className="py-24 text-center bg-surface/50 rounded-[2rem] border-2 border-dashed border-line">
          <p className="text-stone-300 font-bold">참여하신 후원 내역이 아직 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {donationHistory.slice(0, 5).map((item, index) => (
            <div
              key={item.transaction?.transactionNo ?? `${item.campaignNo}-${index}`}
              className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-lg hover:shadow-primary/5 transition-all group"
            >
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                  <p className="text-base font-bold text-ink group-hover:text-primary transition-colors line-clamp-1">{item.title}</p>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-stone-400">
                    <Calendar size={12} className="text-primary/40" />
                    {formatDate(item.transaction?.sentAt || item.transaction?.createdAt || item.donatedAt)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end gap-1 shrink-0">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-ink tracking-tight">
                    {Number(item.priceamount || 0).toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-stone-400">원</span>
                </div>
                
                {item.transaction?.txHash && (
                  <a 
                    href={`/blockchain/transactions/${item.transaction.txHash}`}
                    className="text-[10px] text-stone-300 font-bold hover:text-primary flex items-center gap-1 transition-colors"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ReceiptText size={11} />
                    증명서 확인 <ExternalLink size={10} className="opacity-40" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
