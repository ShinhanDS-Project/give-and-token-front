const API_BASE_URL = '/api/ai';

export const recommendationApi = {
  /**
   * 사용자의 기부 이유(자연어)를 기반으로 최적의 캠페인을 검색합니다.
   * @param {string} reason 
   */
  searchByReason: async (reason) => {
    const response = await fetch(`${API_BASE_URL}/search?reason=${encodeURIComponent(reason)}`);
    if (!response.ok) {
      throw new Error('AI 검색 중 오류가 발생했습니다.');
    }
    return response.json();
  },

  /**
   * 로그인된 사용자의 기부 패턴을 분석하여 맞춤형 캠페인을 추천합니다.
   */
  getRecommendations: async () => {
    // Note: getRecommendations in controller uses Authentication, so we need to pass token if it's not handled by interceptors.
    // Based on Navbar.jsx, it seems accessToken is stored in localStorage or cookie.
    const token = localStorage.getItem('accessToken');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/recommendations`, {
      headers,
      credentials: 'include',
    });
    if (!response.ok) {
        if (response.status === 401) {
            throw new Error('로그인이 필요합니다.');
        }
      throw new Error('추천 내역을 가져오는 중 오류가 발생했습니다.');
    }
    return response.json();
  }
};
