import { useState } from "react";
import ModalLayout from "./ModalLayout";
import { findEmail } from "../api/authApi";
import { User, Phone, Mail, Search, ArrowRight, RefreshCw, LogIn } from "lucide-react";

export default function EmailFindModal({ onClose }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
  });

  const [resultEmail, setResultEmail] = useState("");
  const [message, setMessage] = useState("");
  const [searching, setSearching] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFindEmail = async () => {
    if (!form.name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    if (!form.phone.trim()) {
      alert("전화번호를 입력해주세요.");
      return;
    }

    try {
      setSearching(true);
      setMessage("");
      setResultEmail("");

      const response = await findEmail({
        name: form.name,
        phone: form.phone,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "가입 정보를 찾을 수 없습니다.");
      }

      const data = await response.json();

      if (data && data.email) {
        setResultEmail(data.email);
      } else {
        throw new Error("이메일 정보가 응답에 없습니다.");
      }
    } catch (error) {
      console.error(error);
      setMessage(error.message);
    } finally {
      setSearching(false);
    }
  };

  return (
      <ModalLayout title="이메일 찾기" onClose={onClose}>
        <div className="p-8">
          {!resultEmail ? (
              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3 items-start">
                  <Search className="text-primary mt-1 shrink-0" size={18} />
                  <p className="text-sm text-slate-500 leading-relaxed">
                    가입 시 등록한 이름과 전화번호를 입력하시면<br />
                    등록된 이메일 주소의 일부를 확인하실 수 있습니다.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">이름</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                      <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="성함 입력"
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:bg-white focus:outline-none transition-all text-slate-700 font-medium"
                          disabled={searching}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">전화번호</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={20} />
                      <input
                          type="text"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="010-0000-0000"
                          className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-primary focus:bg-white focus:outline-none transition-all text-slate-700 font-medium"
                          disabled={searching}
                      />
                    </div>
                  </div>
                </div>

                <button
                    onClick={handleFindEmail}
                    disabled={searching}
                    className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-100 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group disabled:bg-slate-200 disabled:shadow-none"
                >
                  {searching ? (
                      <RefreshCw className="animate-spin" size={20} />
                  ) : (
                      <>
                        조회하기
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                  )}
                </button>

                {message && (
                    <p className="text-center text-rose-500 text-sm font-medium bg-rose-50 py-3 rounded-xl border border-rose-100">
                      {message}
                    </p>
                )}
              </div>
          ) : (
              <div className="text-center space-y-8 py-4">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100">
                    <Mail className="text-emerald-500" size={32} />
                  </div>
                </div>

                <div>
                  <p className="text-slate-500 text-sm font-medium mb-3">가입된 이메일을 찾았습니다</p>
                  <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-6 shadow-inner relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5 text-emerald-500">
                      <Mail size={80} />
                    </div>
                    <p className="text-2xl font-black text-emerald-600 tracking-wide relative z-10">
                      {resultEmail}
                    </p>
                  </div>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed">
                  개인정보 보호를 위해 이메일의 일부가 마스킹 처리되었습니다.<br />
                  전체 주소가 기억나지 않으시면 고객센터로 문의해주세요.
                </p>

                <div className="flex gap-4">
                  <button
                      onClick={() => {
                        setResultEmail("");
                        setMessage("");
                      }}
                      className="flex-1 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-slate-600 font-bold hover:bg-white hover:border-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <RefreshCw size={18} />
                    다시 조회
                  </button>
                  <button
                      onClick={onClose}
                      className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-900 shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn size={18} />
                    로그인하기
                  </button>
                </div>
              </div>
          )}
        </div>
      </ModalLayout>
  );
}
