import { CheckCircle2 } from "lucide-react";

function getStatusLabel(value) {
  if (!value) {
    return "-";
  }

  switch (value) {
    case "PENDING":
      return "검토 대기중";
    case "APPROVED":
      return "승인";
    case "REJECTED":
      return "반려";
    default:
      return value;
  }
}

export default function FoundationApplicationResult({ result, authInfo, campaignTitle }) {
  return (
    <>
      <main className="min-h-screen bg-[#f8fafc] px-4 py-10 text-ink">
        <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl -translate-y-6 items-center justify-center md:[zoom:1.06]">
          <div className="rounded-2xl border border-[#e8ecf2] bg-white p-2 shadow-sm md:p-4">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-7 px-4 py-8">
              <header className="space-y-3 text-center">
                <p className="text-sm font-bold text-primary">새 캠페인 신청</p>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20">
                  <CheckCircle2 size={40} strokeWidth={2.5} />
                </div>
                <h1 className="text-[1.7rem] font-bold leading-snug text-ink">
                  신청이 완료되었습니다
                </h1>
                <p className="text-sm leading-relaxed text-ink/60">
                  캠페인 등록 요청이 정상적으로 접수되었습니다.
                  <br />
                  관리자 검토 후 승인 여부가 반영됩니다.
                </p>
              </header>

              <section className="space-y-5 rounded-[1.25rem] border border-[#e8ecf2] bg-white p-6 shadow-sm">
                <h2 className="text-[1.02rem] font-bold text-ink [font-family:'Nanum_Gothic',sans-serif]">
                  신청 정보 요약
                </h2>
                <dl className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] px-4 py-3">
                    <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">상태</dt>
                    <dd className="mt-1 text-base font-bold text-primary">
                      {getStatusLabel(result.approvalStatus)}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] px-4 py-3">
                    <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">메시지</dt>
                    <dd className="mt-1 text-base font-semibold text-ink">
                      {result.message || "등록 요청이 완료되었습니다."}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] px-4 py-3">
                    <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">캠페인 번호</dt>
                    <dd className="mt-1 text-base font-bold text-ink">{result.campaignNo || "-"}</dd>
                  </div>
                  <div className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] px-4 py-3">
                    <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">기부단체</dt>
                    <dd className="mt-1 text-base font-bold text-ink">
                      {authInfo?.foundationName || result.foundationNo || "-"}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-[#e8ecf2] bg-[#f8fafc] px-4 py-3 sm:col-span-2">
                    <dt className="text-xs font-bold uppercase tracking-widest text-slate-400">캠페인 제목</dt>
                    <dd className="mt-1 text-base font-semibold text-ink">
                      {campaignTitle || result.title || "-"}
                    </dd>
                  </div>
                </dl>
              </section>

              <button
                type="button"
                className="w-full rounded-full bg-primary px-6 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
                onClick={() => {
                  window.location.href = "/foundation/me";
                }}
              >
                대시보드로 돌아가기
              </button>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

