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

// --- 아래 두 함수가 EmailFindModal.jsx에서 사용될 새로운 API 함수입니다 ---

// 이름과 전화번호로 이메일 찾기용 인증번호 발송 요청
export async function requestEmailFind({ name, phone }) {
  // TODO: 실제 백엔드 API 엔드포인트로 변경해야 합니다.
  // 이 예시에서는 가상의 엔드포인트를 사용합니다.
  const response = await fetch("/api/auth/email-find/request-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, phone }),
  });

  // 백엔드 응답 형식에 따라 적절히 처리해야 합니다.
  // 여기서는 단순히 응답 객체를 반환합니다.
  return response;
}

// 이름, 전화번호, 인증코드로 이메일 찾기 및 확인
export async function verifyPhoneForEmailFind({ name, phone, code }) {
  // TODO: 실제 백엔드 API 엔드포인트로 변경해야 합니다.
  // 이 예시에서는 가상의 엔드포인트를 사용합니다.
  const response = await fetch("/api/auth/email-find/verify-code", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, phone, code }),
  });

  // 백엔드 응답 형식에 따라 적절히 처리해야 합니다.
  // 예를 들어, 성공 시 이메일 정보를 반환하거나 실패 시 에러를 던질 수 있습니다.
  return response;
}