import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginRoleSelector from "../components/LoginRoleSelector";
import LoginForm from "../components/LoginForm";
import LoginLinks from "../components/LoginLinks";
import SocialLoginSection from "../components/SocialLoginSection";
import EmailFindModal from "../components/EmailFindModal";
import PasswordResetModal from "../components/PasswordResetModal";
// 검토: authApi.js의 loginLocal 함수는 API 주소가 '/api/auth/login/user/local'로 고정되어 있습니다.
// 'beneficiary', 'foundation' 같은 다른 역할에 따라 동적으로 주소를 변경해주는 기능이 필요해 보입니다.
// 예를 들어, loginByRole(role, loginData)와 같은 함수를 authApi.js에 새로 만드는 것을 고려해볼 수 있습니다.
import { loginLocal } from "../api/authApi";

const LoginPage = () => {
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    // 참고: 사용자가 UI에서 역할을 선택하지만, 이 'role' 값이 아래 handleLocalLogin 함수에서
    // API로 전송되지 않고 있습니다.
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
        navigate("/foundation/dashboard");
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

      // --- 문제 지점 ---
      // 1. loginLocal을 호출할 때 사용자가 선택한 역할(loginData.role)이 파라미터로 전달되지 않습니다.
      //    백엔드 API가 역할에 따라 다른 로직을 처리한다면 이 값을 함께 보내야 합니다.
      // 2. 현재 authApi.js의 loginLocal 함수는 'user' 역할에 대한 API 주소만 사용하고 있습니다.
      //
      // --- 수정 제안 ---
      // authApi.js에 역할(role)에 따라 다른 API 주소로 요청을 보내는 새로운 함수를 만들거나
      // 기존 loginLocal 함수를 수정해야 합니다.
      //
      // 예시:
      // const response = await loginByRole(loginData.role, {
      //   email: loginData.email,
      //   password: loginData.password,
      // });
      //
      // authApi.js에서는 전달받은 role에 따라 동적으로 API 주소를 생성합니다.
      // ex) `/api/auth/login/${role}/local`

      const response = await loginLocal(loginData.role,{
        email: loginData.email,
        password: loginData.password,
        // 검토: 이 파라미터에는 "LOCAL"이라는 값만 고정되어 있고,
        // 실제 로그인해야 할 역할(user, beneficiary, foundation) 정보가 누락되었습니다.

      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "로그인에 실패했어.");
      }

      const data = await response.json();
      console.log("로그인 성공:", data);

      redirectByRole(loginData.role);
    } catch (error) {
      console.error("로그인 중 오류 발생:", error);
      setLoginError(error.message || "로그인 중 오류가 발생했어.");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/oauth2/authorization/google";
  };

  const goToSignUp = () => {
    navigate("/signup");
  };

  return (
      <div>
        <h1>로그인</h1>

        <LoginRoleSelector
            role={loginData.role}
            onChange={handleChange}
        />

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

        <hr />

        <SocialLoginSection
            onGoToSignUp={goToSignUp}
            onGoogleLogin={handleGoogleLogin}
        />

        {isEmailFindOpen && (
            <EmailFindModal onClose={() => setIsEmailFindOpen(false)} />
        )}

        {isPasswordResetOpen && (
            <PasswordResetModal
                onClose={() => setIsPasswordResetOpen(false)}
            />
        )}
      </div>
  );
};

export default LoginPage;