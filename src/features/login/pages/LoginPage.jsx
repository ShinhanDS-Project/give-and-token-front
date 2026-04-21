import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import LoginRoleSelector from "../components/LoginRoleSelector";
import LoginForm from "../components/LoginForm";
import LoginLinks from "../components/LoginLinks";
import SocialLoginSection from "../components/SocialLoginSection";
import EmailFindModal from "../components/EmailFindModal";
import PasswordResetModal from "../components/PasswordResetModal";
import { loginLocal } from "../api/authApi";

const LoginPage = () => {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    role: "user",
    email: "",
    password: "",
  });

  const [loginError, setLoginError] = useState("");
  const [isEmailFindOpen, setIsEmailFindOpen] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const redirectByRole = (role) => {
    switch (role) {
      case "foundation":
        navigate("/foundation/me");
        break;
      case "beneficiary":
        navigate("/beneficiary/main");
        break;
      case "user":
      default:
        navigate("/");
        break;
    }
  };

  const handleLocalLogin = async (e) => {
    e.preventDefault();

    const extractErrorMessage = async (response) => {
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          return data.message || "로그인에 실패했습니다.";
        } else {
          const text = await response.text();
          return text || "로그인에 실패했습니다.";
        }
      } catch (e) {
        return "로그인에 실패했습니다.";
      }
    };

    try {
      setLoginError("");

      const response = await loginLocal(loginData.role, {
        email: loginData.email,
        password: loginData.password,
      });

      if (!response.ok) {
        const message = await extractErrorMessage(response);
        throw new Error(message);
      }

      const data = await response.json().catch(() => null);
      console.log("로그인 성공:", data);

      const rawToken = String(data?.accessToken || "")
          .replace(/^Bearer\s+/i, "")
          .trim();

      if (rawToken) {
        window.localStorage.setItem("accessToken", rawToken);
      }

      window.localStorage.setItem("userRole", loginData.role);

      if (loginData.role === "foundation") {
        window.localStorage.setItem("foundationAccessToken", rawToken);
        window.localStorage.setItem(
            "foundationAuthInfo",
            JSON.stringify({
              foundationNo: data?.foundationNo ?? null,
              foundationName: data?.foundationName ?? "",
              email: data?.email ?? loginData.email,
              tokenType: data?.tokenType ?? "Bearer",
            }),
        );
      }

      redirectByRole(loginData.role);
    } catch (error) {
      console.error("로그인 중 오류 발생:", error);
      setLoginError(error.message || "로그인 중 오류가 발생했습니다.");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/oauth2/authorization/google";
  };

  const goToSignUp = () => {
    if (loginData.role === "foundation") {
      navigate("/organization/apply/form");
      return;
    }

    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full min-h-[620px] space-y-6 p-10 bg-white rounded-2xl shadow-lg text-ink">
        <h1 className="text-center text-3xl font-display font-bold tracking-tight text-ink">
          로그인
        </h1>

        <LoginRoleSelector role={loginData.role} onChange={handleChange} />

        <LoginForm
          loginData={loginData}
          onChange={handleChange}
          onSubmit={handleLocalLogin}
          errorMessage={loginError}
        />

        {loginData.role === "user" && (
          <LoginLinks
            onOpenFindEmail={() => setIsEmailFindOpen(true)}
            onOpenPasswordReset={() => setIsPasswordResetOpen(true)}
          />
        )}

        <>
          <div className="relative flex py-3 items-center">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-xs">
              또는
            </span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <SocialLoginSection
            role={loginData.role}
            onGoToSignUp={goToSignUp}
            onGoogleLogin={handleGoogleLogin}
          />
        </>

        <AnimatePresence>
          {isEmailFindOpen && (
            <EmailFindModal
              role={loginData.role}
              onClose={() => setIsEmailFindOpen(false)}
            />
          )}

          {isPasswordResetOpen && (
            <PasswordResetModal
              role={loginData.role}
              onClose={() => setIsPasswordResetOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LoginPage;
