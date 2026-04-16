import { Sparkles, LogOut, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // 쿠키 및 로컬스토리지에서 로그인 상태를 확인하는 함수
  const checkLoginStatus = () => {
    // 1. 쿠키 확인
    const cookies = document.cookie.split(';');
    const hasCookieToken = cookies.some(cookie => cookie.trim().startsWith('accessToken='));
    
    // 2. 로컬스토리지 확인 (로컬 로그인 시 사용)
    const hasLocalStorageToken = !!localStorage.getItem('accessToken');
    
    if (hasCookieToken || hasLocalStorageToken) {
        setUserRole(localStorage.getItem('userRole') || 'user');
        return true;
    }
    return false;
  };

  useEffect(() => {
    // 마운트 시 로그인 상태 체크
    setIsLoggedIn(checkLoginStatus());

    // 페이지 이동이나 포커스 시 주기적으로 체크하여 상태 업데이트
    const handleFocus = () => setIsLoggedIn(checkLoginStatus());
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleLogout = async () => {
    try {
      // 역할에 따라 로그아웃 URL 분기 (필요시)
      const logoutUrl = userRole === 'beneficiary' ? "/api/beneficiary/logout" : "/api/auth/logout/user/social";
      
      await fetch(logoutUrl, { 
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      
      // 2. 로컬스토리지 삭제
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      
      setIsLoggedIn(false);
      setUserRole(null);
      alert("로그아웃 되었습니다.");
      
      // 로그아웃 즉시 반영을 위해 메인으로 이동
      window.location.href = "/";
    } catch (error) {
      console.error("로그아웃 중 오류 발생:", error);
      // 에러가 나더라도 클라이언트 정보는 삭제
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      window.location.href = "/";
    }
  };

  const getDashboardLink = () => {
    switch (userRole) {
      case 'beneficiary':
        return "/beneficiary/main";
      case 'foundation':
        return "/foundation/dashboard";
      case 'user':
      default:
        return "/mypage";
    }
  };

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
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Link 
                  to={getDashboardLink()} 
                  className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
                >
                  <User size={16} />
                  {userRole === 'beneficiary' ? '수혜자 홈' : (userRole === 'foundation' ? '단체 대시보드' : '마이페이지')}
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-stone-100 text-stone-600 px-4 py-2.5 rounded-full text-sm font-bold hover:bg-stone-200 transition-all flex items-center gap-2"
                  title="로그아웃"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link 
                to="/login" 
                className="bg-primary text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
