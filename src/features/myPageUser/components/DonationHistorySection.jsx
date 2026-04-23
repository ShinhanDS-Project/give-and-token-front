import { ChevronRight, ExternalLink, Calendar, ReceiptText } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

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

function getCampaignId(item) {
  return (
    item?.campaignNo ??
    item?.campaignId ??
    item?.campaign?.campaignNo ??
    item?.campaign?.id ??
    item?.transaction?.campaignNo ??
    item?.transaction?.campaignId ??
    null
  );
}

function getDonationTimestamp(item) {
  const rawDate =
    item?.transaction?.sentAt ||
    item?.transaction?.createdAt ||
    item?.donatedAt ||
    null;
  if (!rawDate) return 0;
  const timestamp = new Date(rawDate).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function DonationHistorySection({
  donationHistory = [],
  onViewAll,
  onOpenTracking,
}) {
  const navigate = useNavigate();
  void onOpenTracking;
  const sortedDonationHistory = [...donationHistory].sort(
    (a, b) => getDonationTimestamp(b) - getDonationTimestamp(a),
  );

  return (
    <section className="mypage-card h-full min-h-0 !pt-8 flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink">
          <ReceiptText size={22} className="text-stone-400" />
          <h3 className="text-[1.4rem] font-bold">최근 후원 활동</h3>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="group flex items-center gap-1 text-sm font-bold text-stone-400 transition-colors hover:text-primary"
        >
          기록 전체보기
          <ChevronRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </button>
      </div>

      {donationHistory.length === 0 ? (
        <div className="rounded-[2rem] border-2 border-dashed border-line bg-surface/50 py-24 text-center">
          <p className="font-bold text-stone-300">참여하신 후원 내역이 아직 없습니다.</p>
        </div>
      ) : (
        <div className="flex-1 min-h-0 space-y-3">
          {sortedDonationHistory.slice(0, 3).map((item, index) => {
            const campaignId = getCampaignId(item);
            const title = item?.title ?? "-";

            return (
              <div
                key={item.transaction?.transactionNo ?? `${item.campaignNo}-${index}`}
                className={`group flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition-all hover:shadow-lg hover:shadow-primary/5 md:flex-row ${
                  campaignId ? "cursor-pointer" : ""
                }`}
                onClick={() => {
                  if (campaignId) navigate(`/campaign/${campaignId}`);
                }}
              >
                <div className="flex-1 text-center md:text-left">
                  <div className="mb-1.5 flex items-center justify-center gap-2 md:justify-start">
                    {campaignId ? (
                      <Link
                        to={`/campaign/${campaignId}`}
                        onClick={(event) => event.stopPropagation()}
                        className="line-clamp-1 text-base font-bold text-ink transition-colors hover:text-primary"
                      >
                        {title}
                      </Link>
                    ) : (
                      <p className="line-clamp-1 text-base font-bold text-ink">{title}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-3 md:justify-start">
                    <span className="flex items-center gap-1 text-[11px] font-bold text-stone-400">
                      <Calendar size={12} className="text-primary/40" />
                      {formatDate(
                        item.transaction?.sentAt ||
                          item.transaction?.createdAt ||
                          item.donatedAt,
                      )}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-center gap-1 md:items-end">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black tracking-tight text-ink">
                      {Number(item.priceamount || 0).toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-stone-400">원</span>
                  </div>

                  {item.transaction?.txHash && (
                    <a
                      href={`/blockchain/transactions/${item.transaction.txHash}`}
                      onClick={(event) => event.stopPropagation()}
                      className="flex items-center gap-1 text-[10px] font-bold text-stone-300 transition-colors hover:text-primary"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ReceiptText size={11} />
                      증명서 확인 <ExternalLink size={10} className="opacity-40" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
