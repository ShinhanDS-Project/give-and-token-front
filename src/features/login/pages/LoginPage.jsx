import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "motion/react";
import LoginRoleSelector from "../components/LoginRoleSelector";
import LoginForm from "../components/LoginForm";
import LoginLinks from "../components/LoginLinks";
import SocialLoginSection from "../components/SocialLoginSection";
import EmailFindModal from "../components/EmailFindModal";
import PasswordResetModal from "../components/PasswordResetModal";
import { loginLocal } from "../api/authApi";
import loginImage from "../../../img/login.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

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

  const getSafeNextPath = () => {
    const params = new URLSearchParams(location.search);
    const nextFromQuery = params.get("next");
    const nextFromState = location.state?.from;
    const candidate = String(nextFromQuery || nextFromState || "").trim();

    if (!candidate) return "";
    if (!candidate.startsWith("/")) return "";
    if (candidate.startsWith("//")) return "";

    return candidate;
  };

  const handleLocalLogin = async (e) => {
    e.preventDefault();

    const extractErrorMessage = async (response) => {
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          return data.message || "로그인에 실패했습니다.";
        }

        const text = await response.text();
        return text || "로그인에 실패했습니다.";
      } catch (err) {
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

      const nextPath = getSafeNextPath();
      if (nextPath) {
        navigate(nextPath, { replace: true });
        return;
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
    <div className="min-h-screen bg-[#FFFDFB] font-sans">
      <div className="login-page-card w-full max-w-5xl mx-auto min-h-screen p-6 md:p-10 text-ink">
        <div className="login-page-layout grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-10 items-center">
          <div className="login-content-panel">
            <h1 className="login-title">
              SIGN IN
            </h1>

            <div className="login-tab-shell">
              <LoginRoleSelector role={loginData.role} onChange={handleChange} />
              <div className="login-tab-panel">
                <LoginForm
                  loginData={loginData}
                  onChange={handleChange}
                  onSubmit={handleLocalLogin}
                  errorMessage={loginError}
                />
                <div className="login-links-slot">
                  {loginData.role === "user" ? (
                    <LoginLinks
                      onOpenFindEmail={() => setIsEmailFindOpen(true)}
                      onOpenPasswordReset={() => setIsPasswordResetOpen(true)}
                    />
                  ) : null}
                </div>

                <SocialLoginSection
                  role={loginData.role}
                  onGoToSignUp={goToSignUp}
                  onGoogleLogin={handleGoogleLogin}
                />
              </div>
            </div>
          </div>

          <div className="login-visual-panel flex items-end justify-center lg:justify-end lg:pb-8 lg:pr-6">
            <img
              src={loginImage}
              alt="로그인"
              className="h-64 md:h-[18rem] lg:h-[25rem] w-auto max-w-none object-contain origin-bottom scale-100 lg:translate-x-6"
            />
          </div>
        </div>

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
