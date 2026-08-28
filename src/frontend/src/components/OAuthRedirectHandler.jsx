// src/components/OAuthRedirectHandler.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const OAuthRedirectHandler = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. URL에서 직접 token 추출
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    // 🔑 2. 이번 로그인 시도에서 이미 alert를 띄웠는지 세션 스토리지로 확인
    const isProcessed = sessionStorage.getItem("oauth_processed");

    if (isProcessed) {
      // 이미 한 번 처리되었다면 추가 실행 없이 바로 종료
      return;
    }

    if (token) {
      // 3. 처리 중복 방지 플래그 저장
      sessionStorage.setItem("oauth_processed", "true");

      console.log("추출된 토큰:", token);
      localStorage.setItem("accessToken", token);

      alert("로그인에 성공했습니다!");

      // 4. 다음 로그인을 위해 플래그 제거 (2초 후) 및 페이지 이동
      setTimeout(() => {
        sessionStorage.removeItem("oauth_processed");
      }, 2000);

      navigate("/", { replace: true });
    } else {
      sessionStorage.setItem("oauth_processed", "true");

      alert("로그인 처리 중 오류가 발생했습니다.");

      setTimeout(() => {
        sessionStorage.removeItem("oauth_processed");
      }, 2000);

      navigate("/", { replace: true });
    }
  }, [navigate]);

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      로그인 처리 중입니다...
    </div>
  );
};

export default OAuthRedirectHandler;
