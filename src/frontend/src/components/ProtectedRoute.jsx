import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const token = localStorage.getItem("accessToken");

  // 토큰이 없으면 알림 후 메인(/)으로 리다이렉트
  if (!token) {
    alert("로그인이 필요한 페이지입니다.");
    return <Navigate to="/" replace />;
  }

  // 토큰이 있으면 자식 컴포넌트(BoardWrite, BoardEdit 등) 렌더링
  return <Outlet />;
};

export default ProtectedRoute;
