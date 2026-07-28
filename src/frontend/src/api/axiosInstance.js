import axios from "axios";

// 1. 기본 Axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: "http://localhost:8080", // 백엔드 서버 주소
  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor: 요청이 전송되기 전에 실행
axiosInstance.interceptors.request.use(
  (config) => {
    // localStorage에서 JWT 토큰 조회
    const token = localStorage.getItem("accessToken");

    if (token) {
      // Authorization 헤더에 Bearer 토큰 주입
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 3. Response Interceptor: 응답을 받았을 때 실행 (선택 사항: 토큰 만료 처리)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized (토큰 만료 또는 유효하지 않음) 처리
    if (error.response && error.response.status === 401) {
      alert("로그인이 필요하거나 세션이 만료되었습니다.");
      localStorage.removeItem("accessToken"); // 유효하지 않은 토큰 삭제
      window.location.href = "/login"; // 로그인 페이지로 리다이렉트
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
