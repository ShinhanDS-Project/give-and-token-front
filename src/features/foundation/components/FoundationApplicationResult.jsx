import { CheckCircle2 } from "lucide-react";
import FoundationChrome from "./FoundationChrome";

function getStatusLabel(value) {
  if (!value) {
    return "-";
  }

  switch (value) {
    case "PENDING":
      return "검토 대기 중";
    case "APPROVED":
      return "승인";
    case "REJECTED":
      return "반려";
    default:
      return value;
  }
}

export default function FoundationApplicationResult({ result, authInfo }) {
  return (
    <>
      <FoundationChrome />
      <section className="mx-auto flex min-h-[70vh] max-w-4xl flex-col items-center justify-center px-4 py-16 text-ink">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/20">
            <CheckCircle2 size={40} strokeWidth={2.5} />
          </div>

        <header className="space-y-3">
          <p className="text-sm text-slate-500">새 캠페인 신청</p>
          <h1 className="text-5xl font-bold tracking-tight text-ink">
            신청 완료!
          </h1>
          <p className="text-base leading-7 text-ink/60">
            새 캠페인 등록 요청이 정상적으로 접수되었습니다.
            <br />
            관리자 검토 후 승인 여부가 반영됩니다.
          </p>
        </header>

        <section className="w-full rounded-[2rem] border-4 border-line bg-white px-7 py-8 text-left shadow-sm">
          <p className="mb-6 text-sm text-slate-400">신청 정보 요약</p>
          <dl className="grid grid-cols-[1fr_auto] gap-x-6 gap-y-5">
            <dt className="text-lg font-semibold text-slate-700">캠페인 번호</dt>
            <dd className="text-lg font-semibold text-slate-900">
              {result.campaignNo || "-"}
            </dd>

            <dt className="text-lg font-semibold text-slate-700">기부단체</dt>
            <dd className="text-lg font-semibold text-slate-900">
              {authInfo?.foundationName || result.foundationNo || "-"}
            </dd>

            <dt className="text-lg font-semibold text-slate-700">상태</dt>
            <dd className="text-lg font-semibold text-primary">
              {getStatusLabel(result.approvalStatus)}
            </dd>

            <dt className="text-lg font-semibold text-slate-700">메시지</dt>
            <dd className="text-lg font-semibold text-slate-900">
              {result.message || "등록 요청이 저장되었습니다."}
            </dd>
          </dl>
        </section>

        <button
          type="button"
          className="w-full rounded-full bg-primary px-6 py-5 text-lg font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
          onClick={() => {
            window.location.href = "/foundation/me";
          }}
        >
          홈으로 돌아가기
        </button>
        </div>
      </section>
    </>
  );
}
