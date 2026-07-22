import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BoardList from "./pages/BoardList";
import BoardWrite from "./pages/BoardWrite";
import BoardDetail from "./pages/BoardDetail";
import BoardEdit from "./pages/BoardEdit";

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
        <h2>게시판 시스템 (React + JavaScript)</h2>
        <Routes>
          <Route path="/" element={<BoardList />} />
          <Route path="/write" element={<BoardWrite />} />
          <Route path="/detail/:id" element={<BoardDetail />} />
          <Route path="/edit/:id" element={<BoardEdit />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
