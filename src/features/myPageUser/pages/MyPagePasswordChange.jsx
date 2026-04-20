import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, AlertCircle, Save } from "lucide-react";
import "../styles/MyPage.css";
import { updatePassword } from "../api/mypageApi";

export default function MyPagePasswordChange() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    newPassword2: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (!form.currentPassword.trim()) {
        setError("현재 비밀번호를 입력해주세요.");
        return;
      }

      if (!form.newPassword.trim()) {
        setError("새 비밀번호를 입력해주세요.");
        return;
      }

      if (!form.newPassword2.trim()) {
        setError("새 비밀번호 확인을 입력해주세요.");
        return;
      }

      if (form.newPassword !== form.newPassword2) {
        setError("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        return;
      }

      const passwordRegex =
        /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/;
      if (!passwordRegex.test(form.newPassword)) {
        setError(
          "새 비밀번호는 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 하며, 8~20자 이내여야 합니다.",
        );
        return;
      }

      await updatePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        newPassword2: form.newPassword2,
      });

      alert("비밀번호가 성공적으로 변경되었습니다.");
      navigate("/mypage");
    } catch (err) {
      console.error(err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        "비밀번호 변경에 실패했습니다.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mypage-sub-page scrollbar-hide">
      <div className="mypage-sub-container scrollbar-hide">
        <header className="mb-12">
          <h1 className="!mb-0 !text-left font-bold text-slate-800">비밀번호 변경</h1>
        </header>

        <section className="mypage-card mypage-sub-card">
          <div className="bg-surface w-16 h-16 rounded-full flex items-center justify-center mb-8 mx-auto border border-line">
            <Lock size={32} className="text-primary" />
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 text-sm font-medium border border-red-100">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-ink/60 uppercase tracking-wider ml-1">
                현재 비밀번호
              </label>
              <input
                type="password"
                name="currentPassword"
                className="px-5 py-3 rounded-2xl border-2 border-line focus:border-primary outline-none transition-colors text-ink font-medium"
                placeholder="현재 비밀번호를 입력하세요"
                value={form.currentPassword}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-ink/60 uppercase tracking-wider ml-1">
                새 비밀번호
              </label>
              <input
                type="password"
                name="newPassword"
                className="px-5 py-3 rounded-2xl border-2 border-line focus:border-primary outline-none transition-colors text-ink font-medium"
                placeholder="새 비밀번호를 입력하세요"
                value={form.newPassword}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold text-ink/60 uppercase tracking-wider ml-1">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                name="newPassword2"
                className="px-5 py-3 rounded-2xl border-2 border-line focus:border-primary outline-none transition-colors text-ink font-medium"
                placeholder="새 비밀번호를 다시 입력하세요"
                value={form.newPassword2}
                onChange={handleChange}
              />
            </div>

            <div className="flex gap-4 mt-8">
              <button
                type="submit"
                className="bg-primary text-white flex-1 py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 hover:bg-primary/90 transition-all justify-center flex items-center"
                disabled={submitting}
              >
                {submitting ? (
                  "변경 중..."
                ) : (
                  <>
                    <Save size={18} className="mr-2" />
                    비밀번호 저장
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn-mypage-outline flex-1 py-4 text-ink/60"
                onClick={() => navigate("/mypage")}
              >
                취소
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}



