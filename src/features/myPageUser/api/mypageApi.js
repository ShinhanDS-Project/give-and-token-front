import axios from "axios";

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
  return axios.post(
      "/api/signup/nickname",
      { nameHash },
      {
        withCredentials: true,
      }
  );
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