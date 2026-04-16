import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginRoleSelector from "../components/LoginRoleSelector";
import LoginForm from "../components/LoginForm";
import LoginLinks from "../components/LoginLinks";
import SocialLoginSection from "../components/SocialLoginSection";
import EmailFindModal from "../components/EmailFindModal";
import PasswordResetModal from "../components/PasswordResetModal";
import { loginLocal } from "../api/authApi";

const LoginPage = () => {
  const navigate = useNavigate();

  // 로그인 여부 확인 함수
  const getIsLoggedIn = () => {
    const cookies = document.cookie.split(";");
    const hasCookieToken = cookies.some((cookie) =>
      cookie.trim().startsWith("accessToken="),
    );
    const hasLocalStorageToken = !!localStorage.getItem("accessToken");
    return hasCookieToken || hasLocalStorageToken;
  };

  // 1. 이미 로그인된 사용자는 메인으로 튕겨냄
  // 2. 구글 로그인 후 리다이렉트(/login/google) 처리
  React.useEffect(() => {
    const isLoggedIn = getIsLoggedIn();
    const isGoogleRedirect = window.location.pathname === "/login/google";

    if (isLoggedIn || isGoogleRedirect) {
      navigate("/", { replace: true });
    }
  }, [navigate]);

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
    try {
      setLoginError("");
      const response = await loginLocal(loginData.role, {
        email: loginData.email,
        password: loginData.password,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "濡쒓렇?몄뿉 ?ㅽ뙣?덉뼱.");
      }

      const data = await response.json().catch(() => null);
      console.log("로그인 성공:", data);
      localStorage.setItem("accessToken", data.accessToken);
      redirectByRole(loginData.role);
    } catch (error) {
      console.error("濡쒓렇??以??ㅻ쪟 諛쒖깮:", error);
      setLoginError(error.message || "濡쒓렇??以??ㅻ쪟媛 諛쒖깮?덉뼱.");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/oauth2/authorization/google";
  };

  const goToSignUp = () => {
    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-lg text-ink">
        <h1 className="text-center text-3xl font-display font-bold tracking-tight text-ink">
          濡쒓렇??
        </h1>

        <LoginRoleSelector role={loginData.role} onChange={handleChange} />

        <LoginForm
          loginData={loginData}
          onChange={handleChange}
          onSubmit={handleLocalLogin}
          errorMessage={loginError}
        />

        <LoginLinks
          onOpenFindEmail={() => setIsEmailFindOpen(true)}
          onOpenPasswordReset={() => setIsPasswordResetOpen(true)}
        />

        {/* 일반 유저(user)인 경우에만 소셜 로그인 섹션 노출 */}
        {loginData.role === "user" && (
          <>
            <div className="relative flex py-5 items-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs">
                또는
              </span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <SocialLoginSection
              onGoToSignUp={goToSignUp}
              onGoogleLogin={handleGoogleLogin}
            />
          </>
        )}

        {isEmailFindOpen && (
          <EmailFindModal onClose={() => setIsEmailFindOpen(false)} />
        )}

        {isPasswordResetOpen && (
          <PasswordResetModal onClose={() => setIsPasswordResetOpen(false)} />
        )}
      </div>
    </div>
  );
};

export default LoginPage;
