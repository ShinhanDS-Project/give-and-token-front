// give-and-token-front/src/features/signUp/api/signupApi.js

// 닉네임 중복 체크 (GET 요청으로 수정)
export async function checkNickname(nameHash) {
  const response = await fetch(`/api/signup/nickname?nameHash=${nameHash}`);
  return response;
}

// 이메일 인증 요청 (기존과 동일)
export async function sendEmailVerification(email) {
  const response = await fetch("/api/auth/users/verification/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      loginType: "LOCAL",
    }),
  });
  return response;
}

// 이메일 인증코드 확인 (기존과 동일)
export async function verifyEmailCode({ email, code }) {
  const response = await fetch("/api/auth/users/verification/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      code,
    }),
  });
  return response;
}

// 회원가입 요청 (역할에 따라 분기 처리)
export async function submitSignup(role, data, profileImage) {
  let endpoint = "";
  let options = {};

  switch (role) {
    case "user": {
      endpoint = "/api/signup/local";
      const formData = new FormData();
      formData.append(
          "dto",
          new Blob([JSON.stringify(data)], { type: "application/json" })
      );
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }
      options = {
        method: "POST",
        body: formData,
      };
      break;
    }
    case "beneficiary": {
      endpoint = "/api/v1/beneficiary/signup";
      options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      };
      break;
    }
    case "foundation": {
      endpoint = "/api/foundation/signup";
      const formData = new FormData();
      formData.append(
          "data",
          new Blob([JSON.stringify(data)], { type: "application/json" })
      );
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }
      options = {
        method: "POST",
        body: formData,
      };
      break;
    }
    default:
      throw new Error(`Invalid role: ${role}`);
  }

  const response = await fetch(endpoint, options);
  return response;
}