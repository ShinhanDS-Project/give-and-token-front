import { User, LogOut, Settings, Lock, Heart, Mail, House } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function ProfileCard({
  myInfo,
  onGoHome,
  onEditProfile,
  onChangePassword,
  onViewDonations,
}) {
<<<<<<< HEAD
  const { pathname } = useLocation();
  const IMAGE_BASE_URL = "http://localhost:8090/uploads/";

  const isHome = pathname === "/mypage";
  const isProfileEdit = pathname === "/mypage/profile-edit";
  const isPasswordChange = pathname === "/mypage/password-change";
  const isDonationHistory = pathname === "/mypage/donation-history";

  const getMenuButtonClass = (isActive) =>
    `w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-[15px] uppercase tracking-widest transition-colors group ${
      isActive ? "bg-white/20 text-white" : "text-white/90 hover:bg-white/15"
    }`;

  const getMenuIconWrapClass = (isActive) =>
    `w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
      isActive ? "bg-white/25" : "bg-white/10 group-hover:bg-white/20"
    }`;

  const getMenuIconClass = (isActive) =>
    `transition-colors ${isActive ? "text-white" : "text-white/60 group-hover:text-white"}`;

=======
  const IMAGE_BASE_URL = "/uploads/";
  
>>>>>>> main
  const getProfileImage = () => {
    if (!myInfo?.profilePath) return null;
    return myInfo.profilePath.startsWith("http")
      ? myInfo.profilePath
      : `${IMAGE_BASE_URL}${myInfo.profilePath}`;
  };

  const handleLogout = () => {
    fetch("/api/auth/logout/user/social", { method: "POST" }).catch(() => {});

    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");

    document.cookie = "accessToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    alert("로그아웃 되었습니다.");
    window.location.href = "/";
  };

  return (
    <section className="mypage-card flex flex-col items-center w-full h-full bg-gradient-to-br from-[#FFB08B] to-primary border-none shadow-[0_10px_40px_-15px_rgba(78,52,46,0.08)]">
      <button className="btn-logout !text-white/60 hover:!text-white" onClick={handleLogout}>
        <LogOut size={14} />
        <span className="font-black tracking-widest text-[12px]">LOGOUT</span>
      </button>

      <div className="mt-8 flex flex-col items-center w-full">
        <div className="mb-6 relative">
          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl scale-110" />
          {myInfo?.profilePath ? (
            <img
              src={getProfileImage()}
              alt="Profile"
              className="relative w-40 h-40 rounded-full border-4 border-white/50 object-cover "
            />
          ) : (
            <div className="relative w-40 h-40 rounded-full bg-white/20 flex items-center justify-center border-4 border-white/30 backdrop-blur-md">
              <User size={48} className="text-white/50" />
            </div>
          )}
        </div>

        <div className="text-center mb-12 w-full px-4 relative">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            {myInfo?.name ?? "사용자"} 님
          </h2>
          <div className="flex items-center justify-center gap-1.5 text-white/70 text-sm font-bold bg-white/10 py-1.5 px-4 rounded-full w-fit mx-auto border border-white/5 backdrop-blur-sm">
            <Mail size={12} className="opacity-50" />
            <span className="break-all">{myInfo?.email ?? "No email"}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 w-full pt-4 border-t border-white/10">
        <button className={getMenuButtonClass(isHome)} onClick={onGoHome}>
          <div className={getMenuIconWrapClass(isHome)}>
            <House size={18} className={getMenuIconClass(isHome)} />
          </div>
          홈
        </button>

        <button className={getMenuButtonClass(isProfileEdit)} onClick={onEditProfile}>
          <div className={getMenuIconWrapClass(isProfileEdit)}>
            <Settings size={18} className={getMenuIconClass(isProfileEdit)} />
          </div>
          정보 수정
        </button>

        <button className={getMenuButtonClass(isPasswordChange)} onClick={onChangePassword}>
          <div className={getMenuIconWrapClass(isPasswordChange)}>
            <Lock size={18} className={getMenuIconClass(isPasswordChange)} />
          </div>
          비밀번호 변경
        </button>

        <button className={getMenuButtonClass(isDonationHistory)} onClick={onViewDonations}>
          <div className={getMenuIconWrapClass(isDonationHistory)}>
            <Heart size={18} className={getMenuIconClass(isDonationHistory)} />
          </div>
          후원 내역
        </button>
      </div>
    </section>
  );
}
