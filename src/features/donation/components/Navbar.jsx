import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl">
      <div className="bg-white/90 backdrop-blur-xl border-4 border-line rounded-[2rem] px-8 py-4 shadow-xl shadow-primary/5">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-primary flex items-center justify-center text-white rounded-2xl rotate-6 group-hover:rotate-0 transition-transform shadow-lg shadow-primary/20">
              <Sparkles size={24} fill="currentColor" />
            </div>
            <span className="text-2xl font-display font-bold tracking-tight text-ink">
              기부엔<span className="text-primary">토큰</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            <Link to="/campaigns" className="text-sm font-bold text-stone-500 hover:text-primary transition-colors">
              캠페인 목록
            </Link>
            <Link to="/transparency" className="text-sm font-bold text-stone-500 hover:text-primary transition-colors">
              투명성 센터
            </Link>
            <Link to="/blockchain" className="text-sm font-bold text-stone-500 hover:text-primary transition-colors">
              대시보드
            </Link>
          </div>

          {/*가빈- 알림 버튼 추가*/}
          <div className="flex items-center gap-4">
            <Link to="/campaigns" className="bg-primary text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
              마이페이지
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
