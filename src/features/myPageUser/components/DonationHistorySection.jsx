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
              className="donation-log-item"
            >
              <div className="flex-1 text-center md:text-left">
                <p className="text-lg font-bold text-ink mb-2">{item.title}</p>
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-stone-400 bg-surface px-2 py-1 rounded-md border border-line">
                    <Calendar size={12} />
                    {formatDate(item.transaction?.sentAt || item.transaction?.createdAt)}
                  </span>
                  <span className="text-[11px] font-bold text-stone-300 uppercase tracking-tighter">#ID-{item.campaignNo}</span>
                </div>
              </div>

              <div className="flex flex-col items-center md:items-end gap-2 mt-4 md:mt-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenTracking(item.campaignNo)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    마이크로트래킹
                  </button>
                  <span className={`status-tag-clean ${
                    item.transaction?.status === 'SUCCESS' ? 'text-emerald-500 border-emerald-100' : 
                    item.transaction?.status === 'PENDING' ? 'text-amber-500 border-amber-100' : 'text-rose-500 border-rose-100'
                  }`}>
                    • {item.transaction?.status ?? "PENDING"}
                  </span>
                  <p className="text-2xl font-black text-ink">
                    {formatAmount(item.transaction?.amount)}
                  </p>
                </div>
                {item.transaction?.txHash && (
                  <a 
                    href={`/blockchain/transactions/${item.transaction.txHash}`}
                    className="text-[10px] text-stone-300 font-bold hover:text-primary flex items-center gap-1 transition-colors"
                    target="_blank"
                    rel="noreferrer"
                  >
                    내역 증명서 확인 <ExternalLink size={10} />
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
