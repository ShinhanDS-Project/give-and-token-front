import { useState, useEffect, useRef, useCallback } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

function getToken(userRole) {
  if (userRole === "foundation") {
    return localStorage.getItem("foundationAccessToken") || "";
  }
  const local = localStorage.getItem("accessToken");
  if (local) return local;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("accessToken="));
  return match ? match.split("=")[1] : "";
}

function getNotificationsPath(userRole) {
  if (userRole === "foundation") return "/foundation/notifications";
  if (userRole === "beneficiary") return "/beneficiary/notifications";
  return "/notifications";
}

function timeAgo(value) {
  if (!value) return "";
  const date = Array.isArray(value)
    ? new Date(value[0], value[1] - 1, value[2], value[3] ?? 0, value[4] ?? 0)
    : new Date(value);
  if (isNaN(date)) return "";
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default function NotificationBell({ userRole, dropPosition = "right", onViewAll }) {
  const [recent, setRecent] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  const token = getToken(userRole);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(
        "/api/notifications?page=0&size=100&sort=created_at,desc",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const items = data.content ?? [];
        setRecent(items.slice(0, 3));
        setUnreadCount(items.filter((n) => !n.read).length);
      }
    } catch {}
  }, [token]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-stone-100 transition-colors"
        title="알림"
      >
        <Bell size={20} className="text-stone-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className={`absolute ${dropPosition === "left" ? "left-0" : "right-0"} top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-100 z-50 overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <span className="font-bold text-sm text-ink">알림</span>
            {unreadCount > 0 && (
              <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">
                미읽음 {unreadCount}건
              </span>
            )}
          </div>

          <div className="divide-y divide-stone-50 max-h-60 overflow-y-auto">
            {recent.length === 0 ? (
              <p className="py-8 text-center text-stone-400 text-sm">
                알림이 없습니다
              </p>
            ) : (
              recent.map((n) => (
                <div
                  key={n.notificationNo}
                  className={`px-4 py-3 flex items-start gap-2 ${
                    n.read ? "" : "bg-orange-50"
                  }`}
                >
                  {!n.read && (
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                  )}
                  <div className={n.read ? "pl-3.5" : ""}>
                    <p className="text-xs text-ink leading-relaxed break-keep line-clamp-2">
                      {n.content}
                    </p>
                    <span className="text-[10px] text-stone-400 mt-0.5 block">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-3 border-t border-stone-100">
            <button
              onClick={() => {
                setOpen(false);
                if (onViewAll) onViewAll();
                else navigate(getNotificationsPath(userRole));
              }}
              className="w-full text-center text-sm font-bold text-primary hover:text-primary/80 transition-colors py-1"
            >
              전체 알림 보기 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
