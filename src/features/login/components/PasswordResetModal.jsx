import { useState } from "react";
import ModalLayout from "./ModalLayout";
import {
  requestPasswordReset,
  verifyEmailCode,
  confirmPasswordReset,
} from "../api/authApi";
import { Mail, User, ShieldCheck, Lock, ArrowRight, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

export default function PasswordResetModal({ role, onClose }) {
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    email: "",
    name: "",
    code: "",
    newPassword: "",
    newPassword2: "",
  });

  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSendCode = async () => {
    const nameLabel = role === "foundation" ? "단체명" : "성함";
    if (!form.email.trim()) {
      alert("이메일을 입력해 주세요.");
      return;
    }
    if (!form.name.trim()) {
      alert(`${nameLabel}을 입력해 주세요.`);
      return;
    }

    try {
      setSending(true);
      setMessage("");

      const response = await requestPasswordReset(role, {
        email: form.email,
        name: form.name,
      });

      if (!response.ok) {
        const message = await extractErrorMessage(
            response,
            "가입 정보를 확인할 수 없거나 인증번호 발송에 실패했습니다."
        );
        throw new Error(message);
      }

      setStep(2);
      setMessage("인증번호가 발송되었습니다.");
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!form.code.trim()) {
      alert("인증번호를 입력해 주세요.");
      return;
    }

    try {
      setVerifying(true);
      setMessage("");

      const response = await verifyEmailCode(role, {
        email: form.email,
        code: form.code,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "인증번호가 일치하지 않습니다.");
      }

      setIsVerified(true);
      setStep(3);
      setMessage("이메일 인증이 완료되었습니다.");
    } catch (error) {
      console.error(error);
      setIsVerified(false);
      setMessage(error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleResetPassword = async () => {
    if (!form.newPassword.trim()) {
      alert("새 비밀번호를 입력해 주세요.");
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,20}$/;
    if (!passwordRegex.test(form.newPassword)) {
      alert("비밀번호는 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 하며, 8~20자 이내여야 합니다.");
      return;
    }

    if (form.newPassword !== form.newPassword2) {
      alert("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    try {
      setResetting(true);
      setMessage("");

      const response = await confirmPasswordReset(role, {
        email: form.email,
        newPassword: form.newPassword,
        newPassword2: form.newPassword2,
        isChecked: isVerified,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "비밀번호 재설정에 실패했습니다.");
      }

      alert("비밀번호가 성공적으로 재설정되었습니다.");
      onClose();
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <ModalLayout title="비밀번호 재설정" onClose={onClose}>
      <div className="p-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-10 relative px-4">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 z-0 mx-12" />
          {[1, 2, 3].map((s) => (
            <div key={s} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                step >= s ? 'bg-primary text-white shadow-lg shadow-orange-100' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > s ? <CheckCircle2 size={20} /> : s}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                step >= s ? 'text-primary' : 'text-slate-300'
              }`}>
                {s === 1 ? '정보입력' : s === 2 ? '인증확인' : '변경완료'}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 items-start">
                <AlertCircle className="text-primary mt-1 shrink-0" size={18} />
                <p className="text-sm text-slate-500 leading-relaxed">
                  비밀번호를 재설정할 계정의 이메일과<br />
                  가입 시 등록한 {role === "foundation" ? "단체명" : "이름"}을 입력해주세요.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">이메일</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="example@email.com"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:bg-white focus:outline-none transition-all text-slate-700 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                    {role === "foundation" ? "단체명" : "이름"}
                  </label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder={role === "foundation" ? "단체명 입력" : "성함 입력"}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:bg-white focus:outline-none transition-all text-slate-700 font-medium"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSendCode}
                disabled={sending}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-100 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group"
              >
                {sending ? <RefreshCw className="animate-spin" size={20} /> : (
                  <>
                    인증번호 발송
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex gap-3 items-start">
                <ShieldCheck className="text-emerald-500 mt-1 shrink-0" size={18} />
                <p className="text-sm text-emerald-700 leading-relaxed font-medium">
                  {form.email} 주소로 인증번호를 보냈습니다.<br />
                  메일함에서 인증번호를 확인 후 입력해 주세요.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">인증번호</label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="인증번호 6자리 입력"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:bg-white focus:outline-none transition-all text-center text-xl font-black tracking-[0.5em] text-slate-700"
                />
              </div>

              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={verifying}
                className="w-full bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-200 hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
              >
                {verifying ? <RefreshCw className="animate-spin" size={20} /> : "인증번호 확인"}
              </button>

              <button
                type="button"
                onClick={handleSendCode}
                className="w-full text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors"
              >
                인증번호를 받지 못하셨나요? <span className="underline">다시 보내기</span>
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 items-start">
                <Lock className="text-primary mt-1 shrink-0" size={18} />
                <p className="text-sm text-slate-500 leading-relaxed">
                  보안을 위해 영문, 숫자, 특수문자를 포함하여<br />
                  8~20자 이내의 강력한 비밀번호를 설정해 주세요.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">새 비밀번호</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      type="password"
                      name="newPassword"
                      value={form.newPassword}
                      onChange={handleChange}
                      placeholder="영문+숫자+특수문자 8~20자"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:bg-white focus:outline-none transition-all text-slate-700 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">비밀번호 확인</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                    <input
                      type="password"
                      name="newPassword2"
                      value={form.newPassword2}
                      onChange={handleChange}
                      placeholder="비밀번호 다시 입력"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:bg-white focus:outline-none transition-all text-slate-700 font-medium"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={resetting}
                className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-100 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                {resetting ? <RefreshCw className="animate-spin" size={20} /> : "비밀번호 저장 및 변경"}
              </button>
            </div>
          )}

          {message && (
            <p className={`text-center text-sm font-medium py-3 rounded-xl border ${
              step === 2 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'
            }`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </ModalLayout>
  );
}