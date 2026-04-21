import { ArrowRight, Building2, FileText, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: Building2,
    title: "단체 정보 작성",
    description: "운영 중인 기부단체명과 담당자 정보를 먼저 남겨주세요.",
  },
  {
    icon: FileText,
    title: "기본 서류 검토",
    description: "등록 정보와 운영 목적을 확인한 뒤 가입 가능 여부를 안내합니다.",
  },
  {
    icon: Mail,
    title: "가입 안내 전달",
    description: "검토가 끝나면 등록 절차와 다음 단계를 이메일로 보내드립니다.",
  },
];

export default function OrganizationApplyPage() {
  return (
    <section className="relative overflow-hidden bg-[#FFFDFB] pb-24 pt-32">
      <div className="absolute inset-0 watercolor-bg opacity-30" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[3rem] border-4 border-line bg-white p-8 shadow-sm md:p-12">
          <div className="mb-10 max-w-3xl">
            <div className="mb-5 inline-flex rounded-full border border-primary/10 bg-primary/5 px-5 py-2 text-sm font-bold text-primary">
              기부단체 가입 신청
            </div>
            <h1 className="mb-5 text-4xl font-display font-bold leading-tight text-ink md:text-5xl">
              기부엔토큰과 함께할
              <br />
              기부단체 신청 안내
            </h1>
            <p className="text-base font-medium leading-relaxed text-stone-500 md:text-lg">
              단체 소개와 기본 정보를 먼저 전달해주시면 검토 후 가입 절차를 안내해드립니다.
              <br />
              현재 페이지는 신청 안내용이며, 실제 접수 폼은 다음 단계에서 연결할 수 있습니다.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="rounded-[2rem] border-4 border-line bg-[#FFF9F5] p-6"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon size={24} />
                </div>
                <h2 className="mb-3 text-2xl font-display font-bold text-ink">{title}</h2>
                <p className="text-sm font-medium leading-relaxed text-stone-500">
                  {description}
                </p>
              </div>
            ))}
          </div>

          {/*[가빈] 기부단체 가입하기 버튼으로 변경하려고 수정했습니다*/}
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/organization/apply/form"
              className="btn-fairytale inline-flex items-center gap-3 px-8 py-4 text-lg"
            >
              가입신청서 작성하기
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
