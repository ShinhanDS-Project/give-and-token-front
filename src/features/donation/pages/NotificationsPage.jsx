import { useCallback, useEffect, useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";

function getAuthToken() {
  const localToken = localStorage.getItem("accessToken");
  if (localToken) return localToken;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("accessToken="));
  return match ? match.split("=")[1] : null;
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = Array.isArray(value)
    ? new Date(value[0], value[1] - 1, value[2], value[3] ?? 0, value[4] ?? 0)
    : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const token = getAuthToken();

  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(
        `/api/notifications?page=${page}&size=20&sort=created_at,desc`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.content ?? []);
        setTotalPages(data.totalPages ?? 0);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [token, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (notificationNo) => {
    if (!token) return;
    try {
      await fetch(`/api/notifications/${notificationNo}/read`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationNo === notificationNo ? { ...n, read: true } : n,
        ),
      );
    } catch {
      /* ignore */
    }
  };

  const markAllAsRead = async () => {
    if (!token) return;
    try {
      setMarkingAll(true);
      await fetch("/api/notifications/read-all", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      /* ignore */
    } finally {
      setMarkingAll(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#fffaf7] pt-32 px-4 text-center">
        <p className="text-stone-500 text-lg">
          로그인 후 알림을 확인할 수 있습니다.
        </p>
        <Link
          to="/login"
          className="inline-block mt-4 bg-primary text-white px-6 py-2.5 rounded-full text-sm font-bold"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf7] px-4 sm:px-6 pt-32 pb-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Bell size={20} />
            </div>
            <h1 className="text-2xl font-bold text-ink">알림</h1>
          </div>
          <button
            type="button"
            onClick={markAllAsRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-sm font-bold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            <CheckCheck size={16} />
            전체 읽음
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-stone-400">
            알림을 불러오는 중...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4 text-stone-300">
              <Bell size={28} />
            </div>
            <p className="text-stone-400 text-sm">알림이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((noti) => (
              <div
                key={noti.notificationNo}
                className={`bg-white rounded-xl border transition-all ${noti.read ? "border-stone-100 opacity-70" : "border-primary/20 shadow-sm"}`}
              >
                <div className="flex items-start gap-3 px-5 py-4">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${noti.read ? "bg-stone-300" : "bg-primary"}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-ink leading-relaxed break-keep">
                      {noti.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-stone-400">
                        {formatDateTime(noti.createdAt)}
                      </span>
                      {noti.notificationType && (
                        <span className="text-xs text-stone-300 bg-stone-50 px-2 py-0.5 rounded-full">
                          {noti.notificationType}
                        </span>
                      )}
                    </div>
                  </div>
                  {!noti.read && (
                    <button
                      type="button"
                      onClick={() => markAsRead(noti.notificationNo)}
                      className="flex-shrink-0 text-stone-400 hover:text-primary transition-colors p-1"
                      title="읽음 처리"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-4 py-2 text-sm font-bold rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="text-sm text-stone-500 px-3">
              {page + 1} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-4 py-2 text-sm font-bold rounded-lg border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
