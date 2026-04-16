import { Heart, Instagram, Twitter, Youtube, Sparkles, Cloud, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t-8 border-line bg-[#FFF9F5] pt-24 pb-12">
      <div className="absolute left-[5%] top-10 text-stone-200 opacity-50">
        <Cloud size={80} fill="currentColor" />
      </div>
      <div className="absolute bottom-20 right-[5%] text-stone-200 opacity-50">
        <Cloud size={100} fill="currentColor" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-20 grid gap-16 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Link to="/" className="group mb-8 flex items-center gap-4">
              <div className="flex h-14 w-14 rotate-6 items-center justify-center rounded-2xl bg-primary text-white shadow-xl shadow-primary/20 transition-transform group-hover:rotate-0">
                <Sparkles size={28} fill="currentColor" />
              </div>
              <span className="text-3xl font-display font-bold tracking-tight text-ink">
                기부엔<span className="text-primary">토큰</span>
              </span>
            </Link>

            <p className="mb-10 max-w-md text-base font-medium leading-relaxed text-stone-500">
              우리는 아이들의 웃음이 끊이지 않는 동화 같은 세상을 꿈꿉니다.
              <br />
              투명한 나눔으로 더 따뜻한 내일을 함께 만들어가요.
            </p>
          </div>

          <div className="lg:col-span-2">
            <h4 className="mb-8 text-xl font-display font-bold text-ink">나눔 서비스</h4>
            <ul className="space-y-5 text-sm font-bold text-stone-500">
              <li>
                <Link to="/campaigns" className="transition-colors hover:text-primary">
                  캠페인 찾기
                </Link>
              </li>
              <li>
                <Link to="/transparency" className="transition-colors hover:text-primary">
                  투명성 보고서
                </Link>
              </li>
              <li>
                <Link to="/guide" className="transition-colors hover:text-primary">
                  기부 가이드
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-[3rem] border-4 border-line bg-white p-6 shadow-sm">
              <div className="absolute right-0 top-0 h-32 w-32 -mr-16 -mt-16 rounded-full bg-accent/10 blur-2xl" />
              <h4 className="relative mb-4 text-2xl font-display font-bold text-ink">
                기부단체 가입 신청하기
              </h4>
              <p className="relative mb-6 text-sm font-medium text-stone-500">
                함께할 기부단체라면 신청 페이지에서 단체 정보를 남겨 주세요.
                <br />
                확인 후 가입 절차를 안내해드릴게요.
              </p>
              <div className="flex justify-end -mt-1">
                <Link
                  to="/organization/apply"
                  className="relative inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 hover:bg-primary/90 active:translate-y-0 whitespace-nowrap"
                >
                  기부단체 신청 페이지로 가기
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-8 border-t-4 border-line pt-12 text-xs font-bold uppercase tracking-widest text-stone-400 md:flex-row">
          <div className="flex items-center gap-2">
            <Heart size={14} fill="currentColor" className="text-primary" />
            © 2026 GIVE N TOKEN. ALL RIGHTS RESERVED.
          </div>
          <div className="flex gap-10">
            <Link to="/terms" className="transition-colors hover:text-ink">
              이용약관
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-ink">
              개인정보처리방침
            </Link>
            <Link to="/policy" className="transition-colors hover:text-ink">
              나눔 정책
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
