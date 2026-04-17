import { Sparkles, LogOut, User, Bell } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";

function getAuthToken() {
  const localToken = localStorage.getItem("accessToken");
  if (localToken) return localToken;
  const match = document.cookie.split(";").map(c => c.trim()).find(c => c.startsWith("accessToken="));
  return match ? match.split("=")[1] : null;
}

function formatTimeAgo(value) {
  if (!value) return "";
  const date = Array.isArray(value)
    ? new Date(value[0], value[1] - 1, value[2], value[3] ?? 0, value[4] ?? 0)
    : new Date(value);
  if (isNaN(date.getTime())) return "";
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
}

export default function Navbar() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showNotiDropdown, setShowNotiDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notiRef = useRef(null);

  const checkLoginStatus = () => {
    const cookies = document.cookie.split(';');
    const hasCookieToken = cookies.some(cookie => cookie.trim().startsWith('accessToken='));
    const hasLocalStorageToken = !!localStorage.getItem('accessToken');

    if (hasCookieToken || hasLocalStorageToken) {
        setUserRole(localStorage.getItem('userRole') || 'user');
        return true;
    }
    return false;
  };

  const fetchUnreadCount = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch("/api/notifications/unread-count", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const count = await res.json();
        setUnreadCount(count);
      }
    } catch { /* ignore */ }
  }, []);

  const fetchRecentNotifications = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch("/api/notifications?page=0&size=5&sort=created_at,desc", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.content ?? []);
      }
    } catch { /* ignore */ }
  }, []);

  const markAsRead = useCallback(async (notificationNo) => {
    const token = getAuthToken();
    if (!token) return;
    try {
      await fetch(`/api/notifications/${notificationNo}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(prev => prev.map(n => n.notificationNo === notificationNo ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    setIsLoggedIn(checkLoginStatus());
    const handleFocus = () => setIsLoggedIn(checkLoginStatus());
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn, fetchUnreadCount]);

  useEffect(() => {
    if (showNotiDropdown) fetchRecentNotifications();
  }, [showNotiDropdown, fetchRecentNotifications]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notiRef.current && !notiRef.current.contains(e.target)) {
        setShowNotiDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                {/* 알림 벨 */}
                <div className="relative" ref={notiRef}>
                  <button
                    type="button"
                    onClick={() => setShowNotiDropdown(prev => !prev)}
                    className="relative bg-stone-100 text-stone-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-stone-200 transition-all"
                    title="알림"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotiDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-stone-200 rounded-2xl shadow-2xl shadow-stone-200/50 z-[999] overflow-hidden">
                      <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
                        <span className="text-sm font-bold text-ink">알림</span>
                        {unreadCount > 0 && (
                          <span className="text-xs font-bold text-primary">{unreadCount}개 안읽음</span>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length ? (
                          notifications.map(noti => (
                            <button
                              key={noti.notificationNo}
                              type="button"
                              className={`w-full text-left px-4 py-3 border-b border-stone-50 hover:bg-stone-50 transition-colors ${noti.read ? "opacity-60" : ""}`}
                              onClick={() => {
                                if (!noti.read) markAsRead(noti.notificationNo);
                                setShowNotiDropdown(false);
                              }}
                            >
                              <p className="text-sm text-ink leading-snug line-clamp-2">{noti.content}</p>
                              <span className="text-xs text-stone-400 mt-1 block">{formatTimeAgo(noti.createdAt)}</span>
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-sm text-stone-400">알림이 없습니다</div>
                        )}
                      </div>
                      <div className="border-t border-stone-100">
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotiDropdown(false)}
                          className="block text-center py-3 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                        >
                          전체보기
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

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
