// give-and-token-front/src/features/signUp/api/signupApi.js

export async function checkNickname(nameHash) {
  const response = await fetch(`/api/signup/nickname?nameHash=${nameHash}`);
  return response;
}

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

// token 파라미터 추가
export async function submitSignup(role, data, profileImage, token = null) {
  let endpoint = "";
  let options = {};

  switch (role) {
    case "user": {
      const formData = new FormData();
      formData.append(
          "dto",
          new Blob([JSON.stringify(data)], { type: "application/json" })
      );

      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      // 핵심: loginType에 따라 local / google 분기
      if (data.loginType === "GOOGLE") {
        endpoint = "/api/signup/google";
        options = {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        };
      } else {
        endpoint = "/api/signup/local";
        options = {
          method: "POST",
          body: formData,
        };
      }
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