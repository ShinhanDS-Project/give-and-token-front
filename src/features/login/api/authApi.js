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

const getSupportPathByRole = (role, action) => {
  if (role === 'user') {
    switch (action) {
      case 'email': return '/users/support/email';
      case 'reset-request': return '/users/support/password/reset/request';
      case 'reset-verify': return '/users/support/password/reset/verify';
      case 'reset-confirm': return '/users/support/password/reset/confirm';
      default: return '';
    }
  } else if (role === 'beneficiary') {
    switch (action) {
      case 'email': return '/api/v1/beneficiary/support/email';
      case 'reset-request': return '/api/v1/beneficiary/support/password/reset/request';
      case 'reset-verify': return '/api/v1/beneficiary/support/password/reset/verify';
      case 'reset-confirm': return '/api/v1/beneficiary/support/password/reset/confirm';
      default: return '';
    }
  } else if (role === 'foundation') {
    switch (action) {
      case 'email': return '/api/foundation/support/email';
      case 'reset-request': return '/api/foundation/support/password/reset/request';
      case 'reset-verify': return '/api/foundation/support/password/reset/verify';
      case 'reset-confirm': return '/api/foundation/support/password/reset/confirm';
      default: return '';
    }
  }
  return '';
};

export async function findEmail(role, findData) {
  const path = getSupportPathByRole(role, 'email');
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(findData),
  });

  return response;
}

export async function requestPasswordReset(role, resetData) {
  const path = getSupportPathByRole(role, 'reset-request');
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(resetData),
  });

  return response;
}

export async function verifyEmailCode(role, { email, code }) {
  const basePath = getSupportPathByRole(role, 'reset-verify');
  const response = await fetch(`${basePath}?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return response;
}

export async function confirmPasswordReset(role, confirmData) {
  const path = getSupportPathByRole(role, 'reset-confirm');
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(confirmData),
  });

  return response;
}