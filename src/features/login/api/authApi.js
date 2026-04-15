// 역할(role)에 따라 올바른 API 경로를 반환하는 헬퍼 함수
const getLoginPathByRole = (role) => {
  switch (role) {
    case 'user':
      return '/api/auth/login/user/local';
    case 'foundation':
      return '/api/foundation/login';
    case 'beneficiary':
      return '/api/v1/beneficiary/signin';
    default:
      // 기본 경로 또는 에러 처리
      throw new Error(`로그인 할 수 없는 역할입니다: ${role}`);
  }
};

// 역할(role)과 로그인 데이터를 파라미터로 받아 API를 호출하도록 수정합니다.
export async function loginLocal(role, loginData) {
  const path = getLoginPathByRole(role); // 역할에 맞는 경로 가져오기

  const response = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(loginData),
  });

  return response;
}

export async function findEmail(findData) {
  const response = await fetch("/users/support/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(findData),
  });

  return response;
}

export async function requestPasswordReset(resetData) {
  const response = await fetch("/users/support/password/reset/request", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(resetData),
  });

  return response;
}

export async function verifyEmailCode({ email, code }) {
  const response = await fetch("/users/verification/verify", {
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

export async function confirmPasswordReset(confirmData) {
  const response = await fetch("/users/support/password/reset/confirm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(confirmData),
  });

  return response;
}