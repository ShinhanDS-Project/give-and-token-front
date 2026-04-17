import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import SignupRoleSelector from "../components/SignupRoleSelector";
import SignupFormFields from "../components/SignupFormFields";
import "../styles/SignupPage.css";
import {
  checkNickname,
  sendEmailVerification,
  verifyEmailCode,
  submitSignup,
} from "../api/signupApi";

// 모든 필드를 포함하는 초기 상태
const initialFormData = {
  role: "user",
  profileImage: null,
  // User & Beneficiary 공통
  email: "",
  password: "",
  password2: "",
  name: "",
  phone: "",
  // User 전용
  nameHash: "",
  birth: "",
  // Beneficiary 전용
  account: "",
  beneficiaryType: "",
};

const SignupPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 역할 변경 시 상태 초기화
  const handleRoleChange = (newRole) => {
    setFormData({
      ...initialFormData,
      role: newRole,
    });
    setIsNicknameChecked(false);
    setIsEmailVerified(false);
    setShowVerificationInput(false);
    setVerificationCode("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "role") {
      handleRoleChange(value);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "nameHash") {
      setIsNicknameChecked(false);
    }

    if (name === "email") {
      setIsEmailVerified(false);
      setShowVerificationInput(false);
      setVerificationCode("");
    }
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      profileImage: e.target.files?.[0] ?? null,
    }));
  };

  const handleNicknameCheck = useCallback(async () => {
    if (!formData.nameHash.trim()) {
      alert("닉네임을 입력해주세요.");
      return;
    }

    try {
      const response = await checkNickname(formData.nameHash);
      if (response.ok) {
        alert("사용 가능한 닉네임입니다.");
        setIsNicknameChecked(true);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "이미 사용 중인 닉네임입니다.");
      }
    } catch (error) {
      alert("닉네임 체크 중 오류가 발생했습니다.");
    }
  }, [formData.nameHash]);

  const handleSendVerification = useCallback(async () => {
    const { email } = formData;
    if (!email.trim()) {
      alert("이메일을 입력해주세요.");
      return;
    }

    try {
      const response = await sendEmailVerification(email);
      if (response.ok) {
        alert("인증 메일이 발송되었습니다.");
        setShowVerificationInput(true);
      } else {
        const errorData = await response.json();
        alert(errorData.message || "인증 요청 중 오류가 발생했습니다.");
      }
    } catch (error) {
      alert("인증 요청 중 오류가 발생했습니다.");
    }
  }, [formData.email]);

  const handleVerifyCode = useCallback(async () => {
    const { email } = formData;
    if (!verificationCode.trim()) {
      alert("인증코드를 입력해주세요.");
      return;
    }

    try {
      const response = await verifyEmailCode({ email, code: verificationCode });
      if (response.ok) {
        const result = await response.json();
        if (result === true) {
          alert("인증에 성공했습니다.");
          setIsEmailVerified(true);
        } else {
          alert("인증에 실패했습니다. 코드를 확인해주세요.");
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || "인증 확인 중 오류가 발생했습니다.");
      }
    } catch (error) {
      alert("인증코드 확인 중 오류가 발생했습니다.");
    }
  }, [verificationCode, formData.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.role === "user" && !isEmailVerified) {
      alert("이메일 인증이 필요합니다.");
      return;
    }

    if (formData.password !== formData.password2) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (formData.role === "user" && !isNicknameChecked) {
      alert("닉네임 중복 확인이 필요합니다.");
      return;
    }

    setSubmitting(true);

    try {
      let payload = {};
      const { role, profileImage } = formData;

      if (role === "user") {
        payload = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          birth: formData.birth,
          nameHash: formData.nameHash,
          loginType: "LOCAL",
        };
      } else if (role === "beneficiary") {
        payload = {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          account: formData.account,
          beneficiaryType: formData.beneficiaryType,
        };
      }

      const response = await submitSignup(role, payload, profileImage);
      if (response.ok) {
        alert("회원가입이 완료되었습니다.");
        navigate("/login");
      } else {
        const errorData = await response.json();
        alert(errorData.message || "회원가입 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("회원가입 중 오류 발생:", error);
      alert("회원가입 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      <motion.div 
        className="signup-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="signup-header">
          <h1 className="signup-title">Create Account</h1>
          <p className="signup-subtitle">하나뿐인 소중한 나눔을 시작해보세요</p>
        </div>
        
        <form onSubmit={handleSubmit} className="signup-form">
          <SignupRoleSelector
              role={formData.role}
              onChange={handleChange}
          />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={formData.role}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              <SignupFormFields
                  role={formData.role}
                  formData={formData}
                  onChange={handleChange}
                  onFileChange={handleFileChange}
                  onNicknameCheck={handleNicknameCheck}
                  onSendVerification={handleSendVerification}
                  verificationCode={verificationCode}
                  onVerificationCodeChange={(e) => setVerificationCode(e.target.value)}
                  onVerifyCode={handleVerifyCode}
                  showVerificationInput={showVerificationInput}
                  isEmailVerified={isEmailVerified}
                  isGoogleSignup={false}
              />
            </motion.div>
          </AnimatePresence>

          <motion.button 
            type="submit" 
            disabled={submitting} 
            className="submit-button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {submitting ? "Processing..." : "가입하기"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default SignupPage;