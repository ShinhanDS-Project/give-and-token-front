import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
        setError("현재 비밀번호를 입력해.");
        return;
      }

      if (!form.newPassword.trim()) {
        setError("새 비밀번호를 입력해.");
        return;
      }

      if (!form.newPassword2.trim()) {
        setError("새 비밀번호 확인을 입력해.");
        return;
      }

      if (form.newPassword !== form.newPassword2) {
        setError("새 비밀번호와 새 비밀번호 확인이 일치하지 않아.");
        return;
      }

      await updatePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
        newPassword2: form.newPassword2,
      });

      alert("비밀번호가 변경됐어.");
      navigate("/mypage");
    } catch (err) {
      console.error(err);

      const message =
        err?.response?.data?.message ||
        err?.response?.data ||
        "비밀번호 변경에 실패했어.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>비밀번호 변경</h1>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <label>현재 비밀번호</label>
          <input
            type="password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>새 비밀번호</label>
          <input
            type="password"
            name="newPassword"
            value={form.newPassword}
            onChange={handleChange}
          />
        </div>

        <div>
          <label>새 비밀번호 확인</label>
          <input
            type="password"
            name="newPassword2"
            value={form.newPassword2}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "변경 중..." : "저장"}
        </button>
      </form>
    </div>
  );
}