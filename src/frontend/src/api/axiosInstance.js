import axios from "axios";

const API_BASE_URL = "http://localhost:8083";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL, // 백엔드 서버 주소
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Request Interceptor: 모든 요청에 AccessToken 자동 탑재
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 2. Response Interceptor: 401 (토큰 만료) 에러 감지 및 자동 재발급
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Access Token 만료(401) 발생 시 & 재시도하지 않은 요청인 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("Refresh Token이 존재하지 않습니다.");
        }

        // ✨ 백엔드 서버 풀 주소로 재발급 요청 (또는 baseURL 활용)
        const res = await axios.post(`${API_BASE_URL}/api/auth/reissue`, {
          refreshToken: refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          res.data;

        // ✨ 새 Access Token과 Refresh Token 모두 저장 (RTR 적용)
        localStorage.setItem("accessToken", newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // 실패했던 이전 요청의 헤더를 새 토큰으로 교체 후 재요청
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh Token도 만료되었거나 재발급 실패 시 로그아웃 처리
        alert("세션이 만료되었습니다. 다시 로그인해 주세요.");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
