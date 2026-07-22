import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

function BoardList() {
  const [data, setData] = useState({ list: [], totalCount: 0 });
  const [page, setPage] = useState(1);
  const [searchType, setSearchType] = useState("title");
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  const fetchList = async (targetPage = 1) => {
    try {
      const res = await axios.get("/api/boards", {
        params: { page: targetPage, searchType, keyword },
      });
      setData(res.data);
      setPage(targetPage);
    } catch (err) {
      console.error("목록 불러오기 실패:", err);
    }
  };

  useEffect(() => {
    fetchList(1);
  }, []);

  const totalPages = Math.ceil(data.totalCount / 10);

  return (
    <div>
      {/* 검색 및 글쓰기 버튼 */}
      <div style={{ marginBottom: "15px", display: "flex", gap: "8px" }}>
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
        >
          <option value="title">제목</option>
          <option value="content">내용</option>
          <option value="writer">작성자</option>
        </select>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="검색어 입력"
        />
        <button onClick={() => fetchList(1)}>검색</button>
        <button
          onClick={() => navigate("/write")}
          style={{ marginLeft: "auto" }}
        >
          글쓰기
        </button>
      </div>

      {/* 게시글 목록 */}
      <table
        border="1"
        cellPadding="8"
        style={{ width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th>번호</th>
            <th>제목</th>
            <th>작성자</th>
            <th>작성일</th>
          </tr>
        </thead>
        <tbody>
          {data.list && data.list.length > 0 ? (
            data.list.map((item) => (
              <tr key={item.boardId}>
                <td style={{ textAlign: "center" }}>{item.boardId}</td>
                <td>
                  <Link to={`/detail/${item.boardId}`}>{item.title}</Link>
                </td>
                <td style={{ textAlign: "center" }}>{item.writer}</td>
                <td style={{ textAlign: "center" }}>
                  {item.createdAt ? item.createdAt.substring(0, 10) : ""}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="4" style={{ textAlign: "center" }}>
                게시물이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* 페이징 */}
      <div style={{ marginTop: "15px", textAlign: "center" }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            onClick={() => fetchList(p)}
            style={{
              fontWeight: page === p ? "bold" : "normal",
              margin: "0 4px",
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

export default BoardList;
