import { Link } from "react-router-dom";

export default function FoundationProfileCard({ foundation }) {
  if (!foundation) return <p className="text-sm text-stone-500">단체 정보 없음</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {foundation.profilePath ? (
            <img
              src={foundation.profilePath}
              alt={foundation.foundationName}
              className="h-16 w-16 rounded-xl object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-16 w-16 rounded-xl bg-stone-100" />
          )}
          <div>
            <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
              기부단체명
            </div>
            <div className="text-sm font-bold text-ink">{foundation.foundationName}</div>
          </div>
        </div>

        {foundation.foundationNo && (
          <Link
            to={`/foundation/${foundation.foundationNo}`}
            className="text-xs font-bold text-stone-400 transition-colors hover:text-primary"
          >
            자세히 보기
          </Link>
        )}
      </div>

      {foundation.description && (
        <div>
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            기부단체 소개
          </div>
          <p className="text-sm leading-relaxed text-stone-700">{foundation.description}</p>
        </div>
      )}
    </div>
  );
}
