import { User, LogOut, Settings, Lock, Heart, Mail } from "lucide-react";

export default function ProfileCard({
  myInfo,
  onEditProfile,
  onChangePassword,
  onViewDonations,
}) {
  const IMAGE_BASE_URL = "/uploads/";
  
  const getProfileImage = () => {
    if (!myInfo?.profilePath) return null;
    return myInfo.profilePath.startsWith('http') 
      ? myInfo.profilePath 
      : `${IMAGE_BASE_URL}${myInfo.profilePath}`;
  };

  const handleLogout = () => {
    // 1. 서버 로그아웃 호출 (간단하게)
    fetch("/api/auth/logout/user/social", { method: "POST" }).catch(() => {});
    
    // 2. 토큰 삭제
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    
    // 3. 쿠키 삭제 (필요한 경우)
    document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    alert("로그아웃 되었습니다.");
    window.location.href = "/";
  };

  return (
    <section className="mypage-card flex flex-col items-center w-full h-full bg-gradient-to-br from-[#FFB08B] to-primary border-none shadow-2xl shadow-primary/20">
      <button className="btn-logout !text-white/60 hover:!text-white group" onClick={handleLogout}>
        <LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        <span className="font-black tracking-widest text-[10px]">LOGOUT</span>
      </button>

      <div className="mt-8 flex flex-col items-center w-full">
        <div className="mb-6 relative group">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl group-hover:bg-white/40 transition-all scale-110" />
          {myInfo?.profilePath ? (
            <img 
              src={getProfileImage()} 
              alt="프로필" 
              className="relative w-32 h-32 rounded-full border-4 border-white/50 object-cover shadow-2xl"
            />
          ) : (
            <div className="relative w-32 h-32 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30 backdrop-blur-md">
              <User size={48} className="text-white/50" />
            </div>
          )}
        </div>

        <div className="text-center mb-12 w-full px-4 relative">
          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
            {myInfo?.name ?? "사용자"}님
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-white/60 text-xs font-bold bg-white/10 py-1.5 px-4 rounded-full w-fit mx-auto border border-white/5 backdrop-blur-sm">
            <Mail size={12} className="opacity-50" />
            <span className="truncate max-w-[140px]">{myInfo?.email ?? "No email"}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full pt-4 border-t border-white/10">
        <button 
          className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-white/90 font-bold hover:bg-white/15 transition-all text-xs group uppercase tracking-widest"
          onClick={onEditProfile}
        >
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Settings size={16} className="text-white/60 group-hover:text-white" />
          </div>
          정보 수정
        </button>

        <button 
          className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-white/90 font-bold hover:bg-white/15 transition-all text-xs group uppercase tracking-widest"
          onClick={onChangePassword}
        >
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Lock size={16} className="text-white/60 group-hover:text-white" />
          </div>
          비밀번호 변경
        </button>

        <button 
          className="w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-white/90 font-bold hover:bg-white/15 transition-all text-xs group uppercase tracking-widest"
          onClick={onViewDonations}
        >
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <Heart size={16} className="text-white/60 group-hover:text-white" />
          </div>
          나의 후원 내역
        </button>
      </div>
    </section>
  );
}
