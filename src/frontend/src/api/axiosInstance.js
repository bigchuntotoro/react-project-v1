import axios from "axios";

// =========================================================
// API Base URL
//
// 운영:
//   브라우저 → Nginx :83 → Spring Boot :8083
//
// 상대경로 /api 를 사용하면 현재 접속한 서버를 자동으로 사용합니다.
//
// 예:
//   http://100.88.187.37:83/api/boards
// =========================================================
const API_BASE_URL = "/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,

  headers: {
    "Content-Type": "application/json",
  },
});

// =========================================================
// 1. Request Interceptor
// Access Token 자동 첨부
// =========================================================
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

// =========================================================
// 2. Response Interceptor
//
// HTTP 401 발생
//      ↓
// Refresh Token으로 Access Token 재발급
//      ↓
// 기존 요청 재시도
// =========================================================
axiosInstance.interceptors.response.use(
  // 정상 응답
  (response) => response,

  // 오류 응답
  async (error) => {
    const originalRequest = error.config;

    // -------------------------------------------------------
    // originalRequest가 없는 경우
    // -------------------------------------------------------
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // -------------------------------------------------------
    // Access Token 만료
    // -------------------------------------------------------
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // ---------------------------------------------------
        // Refresh Token 가져오기
        // ---------------------------------------------------
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("Refresh Token이 존재하지 않습니다.");
        }

        // ---------------------------------------------------
        // Access Token 재발급
        //
        // /api/auth/reissue
        //
        // 실제 요청:
        // http://100.88.187.37:83/api/auth/reissue
        //
        // Nginx:
        // /api/*
        //      ↓
        // Spring Boot :8083
        // ---------------------------------------------------
        const res = await axios.post(
          `${API_BASE_URL}/auth/reissue`,
          {
            refreshToken: refreshToken,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        // ---------------------------------------------------
        // 새 Token 추출
        // ---------------------------------------------------
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          res.data;

        // ---------------------------------------------------
        // 새 Access Token 저장
        // ---------------------------------------------------
        localStorage.setItem("accessToken", newAccessToken);

        // ---------------------------------------------------
        // RTR 적용 시 Refresh Token도 갱신
        // ---------------------------------------------------
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // ---------------------------------------------------
        // 실패했던 원래 요청에 새 Access Token 적용
        // ---------------------------------------------------
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // ---------------------------------------------------
        // 원래 요청 재실행
        // ---------------------------------------------------
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // ---------------------------------------------------
        // Refresh Token도 만료된 경우
        // ---------------------------------------------------
        alert("세션이 만료되었습니다. 다시 로그인해 주세요.");

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        // React 로그인 페이지
        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
