import axios from "axios";
import router from "../router";
import { useAuth } from "./useAuth";

const { clearToken } = useAuth();
// ========================================================
// API Base URL
// ========================================================
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

// ========================================================
// 1. Request Interceptor
//    JWT Access Token 자동 첨부
// ========================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ========================================================
// 2. Response Interceptor
//    401 → 로그인 페이지 이동
// ========================================================
api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      handleSessionExpired();
    } else if (!error.response && error.message === "Network Error") {
      console.error("네트워크 에러 또는 서버 연결 불가:", error.message);
    }

    return Promise.reject(error);
  },
);

// ========================================================
// Token 삭제 + 로그인 페이지 이동
// ========================================================
const clearTokensAndRedirect = () => {
  clearToken();

  if (router) {
    router.push("/signin");
  } else {
    window.location.href = "/signin";
  }
};

// ========================================================
// 세션 만료 처리
// ========================================================
const handleSessionExpired = () => {
  alert("로그인이 필요하거나 세션이 만료되었습니다.");
  clearTokensAndRedirect();
};

// ========================================================
// 로그인 여부 확인
// ========================================================
const checkAuthToken = () => {
  const token = localStorage.getItem("accessToken");

  if (!token) {
    alert("로그인이 필요한 서비스입니다.");
    clearTokensAndRedirect();

    throw new Error("Access token missing");
  }
};

// ========================================================
// Board API
// ========================================================

// 게시글 목록
export const getBoards = (params) => {
  return api.get("/boards", {
    params,
  });
};

// 게시글 상세
export const getBoard = (id) => {
  return api.get(`/boards/${id}`);
};

// 게시글 등록
export const createBoard = (data) => {
  checkAuthToken();

  return api.post("/boards", data);
};

// 게시글 수정
export const updateBoard = (id, data) => {
  checkAuthToken();

  return api.put(`/boards/${id}`, data);
};

// 게시글 삭제
export const deleteBoard = (id) => {
  checkAuthToken();

  return api.delete(`/boards/${id}`);
};

// ========================================================
// 첨부파일 API
// ========================================================

// 첨부파일 업로드
export const uploadFiles = (id, formData) => {
  checkAuthToken();

  return api.post(`/boards/${id}/files`, formData);
};

// 첨부파일 삭제
export const deleteFile = (fileId) => {
  checkAuthToken();

  return api.delete(`/boards/files/${fileId}`);
};

// ========================================================
// 첨부파일 다운로드
//
// 중요:
// BASE_URL이 "/api"이므로 여기서는 "/boards/..."만 사용
//
// 실제 요청:
// /api/boards/download/{fileId}
// ========================================================
export const downloadFile = (fileId, config = {}) => {
  checkAuthToken();

  return api.get(`/boards/download/${fileId}`, {
    responseType: "blob",
    ...config,
  });
};

// ========================================================
// 첨부파일 이미지 조회
// ========================================================
export const getFileBlob = (fileId) => {
  checkAuthToken();

  return api.get(`/boards/download/${fileId}`, {
    responseType: "blob",
  });
};

// ========================================================
// default export
// ========================================================
export default api;
