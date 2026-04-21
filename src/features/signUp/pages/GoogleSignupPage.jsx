import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SignupFormFields from "../components/SignupFormFields";
import { checkNickname, submitSignup } from "../api/signupApi";
import "../styles/SignupPage.css";

const initialFormData = {
  role: "user",
  profileImage: null,
  email: "",
  password: "",
  password2: "",
  name: "",
  phone: "",
  nameHash: "",
  birth: "",
};

const GoogleSignupPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState(initialFormData);
  const [isNicknameChecked, setIsNicknameChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingSocialInfo, setLoadingSocialInfo] = useState(true);

  useEffect(() => {
    const fetchGoogleSignupInfo = async () => {
      if (!token) {
        alert("구글 회원가입 토큰이 없습니다.");
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          "/api/auth/social-info",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            errorText || "구글 회원가입 정보를 불러오지 못했습니다."
          );
        }

        const data = await response.json();

        setFormData((prev) => ({
          ...prev,
          role: "user",
          email: data.email || "",
          name: data.name || "",
        }));
      } catch (error) {
        console.error(error);
        alert("구글 회원가입 정보를 불러오지 못했습니다.");
        navigate("/login");
      } finally {
        setLoadingSocialInfo(false);
      }
    };

    fetchGoogleSignupInfo();
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;

    if (name === "phone") {
      nextValue = value.replace(/\D/g, "").slice(0, 11);
    }
    setFormData((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    if (name === "nameHash") {
      setIsNicknameChecked(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.password2) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    if (!isNicknameChecked) {
      alert("닉네임 중복 확인이 필요합니다.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        phone: formData.phone,
        birth: formData.birth,
        nameHash: formData.nameHash,
        loginType: "GOOGLE",
      };

      const response = await submitSignup(
        "user",
        payload,
        formData.profileImage,
        token
      );
      if (response.ok) {
        alert("회원가입이 완료되었습니다.");
        navigate("/login");
      } else {
        const errorData = await response.json();
        alert(errorData.message || "회원가입 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("구글 회원가입 중 오류 발생:", error);
      alert("회원가입 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingSocialInfo) {
    return (
      <div className="signup-container">
        <div className="signup-card" style={{ textAlign: "center" }}>
          <p>구글 회원가입 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <h1 className="signup-title">구글 회원가입</h1>
          <p className="signup-subtitle">추가 정보를 입력하여 가입을 완료하세요</p>
        </div>
        <form onSubmit={handleSubmit} className="signup-form">
          <SignupFormFields
            role="user"
            formData={formData}
            onChange={handleChange}
            onFileChange={handleFileChange}
            onNicknameCheck={handleNicknameCheck}
            onSendVerification={() => {}}
            verificationCode=""
            onVerificationCodeChange={() => {}}
            onVerifyCode={() => {}}
            showVerificationInput={false}
            isEmailVerified={true}
            isGoogleSignup={true}
          />
          <button type="submit" disabled={submitting} className="submit-button">
            {submitting ? "가입 중..." : "가입 완료"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GoogleSignupPage;