import axios from "axios";

// =========================================================
// API Base URL
//
// Nginx가 현재 서버의 /api/* 요청을
// Spring Boot :8083으로 전달합니다.
//
// 따라서 baseURL은 빈 문자열로 설정합니다.
//
// axiosInstance.get("/api/boards")
//     ↓
// http://100.88.187.37:83/api/boards
// =========================================================
const API_BASE_URL = "";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// =========================================================
// Request Interceptor
// Access Token 자동 첨부
// =========================================================
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // FormData인 경우 Content-Type을 직접 지정하지 않습니다.
    // 브라우저가 multipart/form-data boundary를 자동 생성합니다.
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },

  (error) => Promise.reject(error),
);

// =========================================================
// Response Interceptor
// Access Token 만료 → Refresh Token 재발급
// =========================================================
axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // -------------------------------------------------------
    // 401 Unauthorized
    // -------------------------------------------------------
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("Refresh Token이 존재하지 않습니다.");
        }

        // ---------------------------------------------------
        // Refresh Token 재발급
        //
        // /api/auth/reissue
        // ---------------------------------------------------
        const res = await axios.post(
          "/api/auth/reissue",
          {
            refreshToken: refreshToken,
          },
          {
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          res.data;

        // ---------------------------------------------------
        // 새 Access Token 저장
        // ---------------------------------------------------
        localStorage.setItem("accessToken", newAccessToken);

        // ---------------------------------------------------
        // Refresh Token Rotation
        // ---------------------------------------------------
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        // ---------------------------------------------------
        // 실패했던 요청에 새 Access Token 적용
        // ---------------------------------------------------
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // ---------------------------------------------------
        // 원래 요청 재시도
        // ---------------------------------------------------
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        alert("세션이 만료되었습니다. 다시 로그인해 주세요.");

        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
