// src/components/OAuthRedirectHandler.jsx
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const OAuthRedirectHandler = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    console.log("추출된 토큰:", token);
    if (token) {
      // 1. 발급받은 JWT를 localStorage에 저장
      localStorage.setItem("accessToken", token);
      alert("로그인에 성공했습니다!");
      // 2. 게시판 목록 페이지로 이동
      navigate("/");
    } else {
      alert("로그인 처리 중 오류가 발생했습니다.");
      navigate("/");
    }
  }, [searchParams, navigate]);

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      로그인 처리 중입니다...
    </div>
  );
};

export default OAuthRedirectHandler;
