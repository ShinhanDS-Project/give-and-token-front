const BASE_URL = '/api/v1/beneficiary';
const REPORT_URL = '/api/v1/final-reports';
const REDEMPTION_URL = '/api/redemptions';
const BLOCKCHAIN_URL = '/api/blockchain';

const getHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const beneficiaryApi = {
  // 수혜자 기본 정보 조회
  getMyInfo: async () => {
    const response = await fetch(`${BASE_URL}/me`, { headers: getHeaders() });
    return response.json();
  },

  // 수혜자 정보 수정
  updateMyInfo: async (data) => {
    const response = await fetch(`${BASE_URL}/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return response.text();
  },

  // 내가 참여 중인 캠페인 목록 (보고서 작성용)
  getMyCampaigns: async () => {
    const response = await fetch(`${REPORT_URL}/campaigns`, { headers: getHeaders() });
    return response.json();
  },

  // 내가 작성한 보고서 목록
  getMyReports: async () => {
    const response = await fetch(`${REPORT_URL}/me`, { headers: getHeaders() });
    return response.json();
  },

  // 보고서 상세 조회
  getReportDetail: async (reportNo) => {
    const response = await fetch(`${REPORT_URL}/${reportNo}`, { headers: getHeaders() });
    return response.json();
  },

  // 보고서 수정
  updateReport: async (reportNo, dto, files) => {
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    
    // JSON 데이터를 Blob으로 만들어 추가 (Spring @RequestPart "dto" 대응)
    formData.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));
    
    // 파일들 추가 (Spring @RequestPart "files" 대응)
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append("files", file);
      });
    }

    const response = await fetch(`${REPORT_URL}/${reportNo}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    return response.text();
  },

  // 보고서 제출
  submitReport: async (dto, files) => {
    const token = localStorage.getItem('accessToken');
    const formData = new FormData();
    
    formData.append("dto", new Blob([JSON.stringify(dto)], { type: "application/json" }));
    
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append("files", file);
      });
    }

    const response = await fetch(`${REPORT_URL}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: formData,
    });
    return response.text();
  },

  // 환전 요청
  requestRedemption: async (data) => {
    const response = await fetch(`${REDEMPTION_URL}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // 지갑 상세 조회 (잔액 등)
  getWalletDetail: async (walletAddress) => {
    const response = await fetch(`${BLOCKCHAIN_URL}/wallets/${walletAddress}`, { headers: getHeaders() });
    return response.json();
  }
};
