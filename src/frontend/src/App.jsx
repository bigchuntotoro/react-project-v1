import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BoardList from "./pages/BoardList";
import BoardWrite from "./pages/BoardWrite";
import BoardDetail from "./pages/BoardDetail";
import BoardEdit from "./pages/BoardEdit";
import OAuthRedirectHandler from "./components/OAuthRedirectHandler";
import ProtectedRoute from "./components/ProtectedRoute"; // 🔑 보호 라우트

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>React + Spring Boot + MyBatis + MariaDB + naverLogin</h2>
        <Routes>
          {/* 🌐 전체 공개 페이지 */}
          <Route path="/" element={<BoardList />} />
          <Route path="/detail/:id" element={<BoardDetail />} />
          <Route path="/oauth/redirect" element={<OAuthRedirectHandler />} />

          {/* 🔐 로그인 사용자 전용 페이지 (보호 구역) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/write" element={<BoardWrite />} />
            <Route path="/edit/:id" element={<BoardEdit />} />
          </Route>
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
