import axios from "axios";

// 요청 인터셉터 - 토큰 자동 주입
axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
);

// 응답 인터셉터 - 401 시 자동 로그아웃
let isRedirecting = false;

axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401 && !isRedirecting) {
        isRedirecting = true;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
);

export function getMyPageInfo() {
  return axios.get("/users/support/mypage/my", {
    withCredentials: true,
  });
}

export function updateMyPageInfo(formData) {
  return axios.patch("/users/support/mypage/my", formData, {
    withCredentials: true,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
}

export function checkNicknameDuplicate(nameHash) {
  return axios.get("/api/signup/nickname", {
    params: { nameHash },
    withCredentials: true,
  });
}

export function getWalletInfo() {
  return axios.get("/users/support/user/wallet", {
    withCredentials: true,
  });
}

export function getTransactionHistory() {
  return axios.get("/users/support/user/wallet/token/transactions", {
    withCredentials: true,
  });
}

export function updatePassword(passwordData) {
  return axios.patch("/users/support/password", passwordData, {
    withCredentials: true,
  });
}

export function getMyDonations() {
  return axios.get("/users/support/user/wallet/token/transactions", {
    withCredentials: true,
  });
}

export function getMicroTracking(campaignNo) {
  return axios.get("/users/support/see", {
    params: { campaignNo },
    withCredentials: true,
  });
}