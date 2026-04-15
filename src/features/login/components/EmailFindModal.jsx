import { useState } from "react";
import ModalLayout from "./ModalLayout";
// Note: 아래 authApi 함수들은 실제 백엔드 API에 맞게 새로 만들거나 수정해야 합니다.
import {
  requestEmailFind,
  verifyPhoneForEmailFind,
} from "../api/authApi";

export default function EmailFindModal({ onClose }) {
  const [step, setStep] = useState(1); // 1: 정보 입력, 2: 인증코드 입력

  const [form, setForm] = useState({
    name: "",
    phone: "",
    code: "",
  });

  const [resultEmail, setResultEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 1. 인증번호 발송 요청 핸들러
  const handleSendCode = async () => {
    if (!form.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    if (!form.phone.trim()) {
      alert("전화번호를 입력해주세요.");
      return;
    }

    try {
      setSending(true);
      setMessage("");
      // API 호출: 이름과 전화번호로 인증번호 발송 요청 (API 수정 필요)
      const response = await requestEmailFind({
        name: form.name,
        phone: form.phone,
      });

      if (!response.ok) {
        throw new Error("인증번호 발송에 실패했습니다.");
      }

      setStep(2);
      setMessage("인증번호가 발송되었습니다.");
      alert("인증번호가 발송되었습니다.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSending(false);
    }
  };

  // 2. 인증번호 확인 및 이메일 조회 핸들러
  const handleVerifyCode = async () => {
    if (!form.code.trim()) {
      alert("인증번호를 입력해주세요.");
      return;
    }

    try {
      setVerifying(true);
      setMessage("");
      setResultEmail("");
      // API 호출: 이름, 전화번호, 코드로 인증 후 이메일 조회 (API 수정 필요)
      const response = await verifyPhoneForEmailFind({
        name: form.name,
        phone: form.phone,
        code: form.code,
      });

      if (!response.ok) {
        throw new Error("인증에 실패했습니다.");
      }

      const data = await response.json();
      setResultEmail(data?.email ?? "");
      setMessage("이메일 조회가 완료되었습니다.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
      <ModalLayout title="이메일 찾기" onClose={onClose}>
        <div>
          {/* Step 1: 이름, 전화번호 입력 */}
          <div>
            <label>이름</label>
            <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                disabled={step > 1}
            />
          </div>

          <div>
            <label>전화번호</label>
            <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="010-0000-0000"
                required
                disabled={step > 1}
            />
          </div>

          {step === 1 && (
              <button onClick={handleSendCode} disabled={sending}>
                {sending ? "발송 중..." : "인증번호 받기"}
              </button>
          )}
        </div>

        {/* Step 2: 인증코드 입력 */}
        {step === 2 && !resultEmail && (
            <div>
              <label>인증번호</label>
              <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="인증번호를 입력하세요"
                  required
              />
              <button onClick={handleVerifyCode} disabled={verifying}>
                {verifying ? "확인 중..." : "확인"}
              </button>
            </div>
        )}

        {/* 최종 결과 */}
        {message && <p>{message}</p>}
        {resultEmail && <p>가입된 이메일: {resultEmail}</p>}
      </ModalLayout>
  );
}