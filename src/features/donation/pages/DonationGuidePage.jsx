import { CreditCard, FileCheck2, Heart, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    title: "캠페인 확인",
    description: "목표 금액, 사용처, 남은 기간, 증빙 문서를 먼저 확인합니다.",
    icon: FileCheck2,
  },
  {
    title: "기부 방식 선택",
    description: " 실명과 익명 기부 방식을 골라 결제 정보를 확인하고, 나에게 맞는 흐름으로 참여합니다.",
    icon: CreditCard,
  },
  {
    title: "기록 확인",
    description: "후원 이후에는 원장과 집행 보고를 통해 흐름을 확인할 수 있습니다.",
    icon: ShieldCheck,
  },
];

export default function DonationGuidePage() {
  return (
    <div className="pt-52 pb-32 watercolor-bg min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white border-2 border-line text-primary text-sm font-bold shadow-sm mb-8">
            <Heart size={16} fill="currentColor" />
            기부 가이드
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-ink leading-tight mb-8">
            처음이어도 편하게
            <br />
            기부할 수 있도록 안내합니다
          </h1>
          <p className="text-lg text-stone-500 leading-relaxed">
            이 사이트에서 어디를 먼저 보면 좋은지, 어떤 정보를 확인하면 좋은지, <br />
            후원 뒤에는 무엇을 체크하면 되는지 한 번에 볼 수 있게 정리했습니다.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-8 mt-16">
          {steps.map((step, index) => (
            <div key={step.title} className="storybook-card bg-white">
              <div className="text-sm font-bold text-primary mb-4">STEP {index + 1}</div>
              <div className="w-16 h-16 rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center mb-6">
                <step.icon size={28} />
              </div>
              <h2 className="text-2xl font-display font-bold text-ink mb-3">{step.title}</h2>
              <p className="text-stone-500 font-medium leading-relaxed">{step.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-20 grid lg:grid-cols-2 gap-10">
          <div className="bg-white border-4 border-line rounded-[3rem] p-10">
            <h2 className="text-3xl font-display font-bold text-ink mb-6">후원 전 체크리스트</h2>
            <ul className="space-y-4 text-stone-600 font-medium">
              <li>목표 금액과 달성률이 현실적인지 확인하기</li>
              <li>캠페인 설명에 구체적인 사용처가 있는지 확인하기</li>
              <li>증빙 문서와 수혜자 정보가 연결되어 있는지 보기</li>
              <li>종료 후 언제, 어떻게 결과 보고가 제공되는지 확인하기</li>
              <li>기부단체의 수수료가 어느정도인지 확인하기</li>
            </ul>
          </div>
          <div className="bg-primary text-white rounded-[3rem] px-10 py-8 self-start">
            <h2 className="text-3xl font-display font-bold mb-6">빠르게 시작하기</h2>
            <p className="text-white/85 leading-relaxed mb-8">
              이미 마음이 가는 분야가 있다면 캠페인 목록에서 카테고리와 검색으로 바로 탐색할 수 있습니다.
            </p>
            <div className="flex flex-wrap justify-end gap-4">
              <Link to="/campaigns" className="bg-white text-primary px-6 py-4 rounded-full font-bold">
                캠페인 목록 보기
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
