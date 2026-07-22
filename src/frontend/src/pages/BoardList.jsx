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

  const totalPages = Math.ceil((data.totalCount || 0) / 10);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      fetchList(1);
    }
  };

  /**
   * 첨부파일 존재 여부 확인 헬퍼 함수
   * 백엔드 전달 DTO 구조(fileCount, hasFile, fileList 중 하나)에 맞춰 자동 판별합니다.
   */
  const hasAttachment = (item) => {
    if (item.fileCount && item.fileCount > 0) return true;
    if (item.hasFile === true || item.hasFile === "Y") return true;
    if (item.fileList && item.fileList.length > 0) return true;
    return false;
  };

  return (
    <div style={styles.container}>
      {/* 헤더 섹션 */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>게시판</h2>
          <p style={styles.subtitle}>
            전체 게시글{" "}
            <span style={styles.highlight}>{data.totalCount || 0}</span>개
          </p>
        </div>
        <button style={styles.writeBtn} onClick={() => navigate("/write")}>
          ✏️ 새 글 작성
        </button>
      </div>

      {/* 검색 바 */}
      <div style={styles.searchBar}>
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          style={styles.select}
        >
          <option value="title">제목</option>
          <option value="content">내용</option>
          <option value="writer">작성자</option>
        </select>

        <div style={styles.inputWrapper}>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="검색어를 입력해 주세요..."
            style={styles.input}
          />
        </div>

        <button onClick={() => fetchList(1)} style={styles.searchBtn}>
          검색
        </button>
      </div>

      {/* 테이블 영역 */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, width: "70px", textAlign: "center" }}>
                번호
              </th>
              <th style={styles.th}>제목</th>
              <th style={{ ...styles.th, width: "60px", textAlign: "center" }}>
                첨부
              </th>
              <th style={{ ...styles.th, width: "120px", textAlign: "center" }}>
                작성자
              </th>
              <th style={{ ...styles.th, width: "130px", textAlign: "center" }}>
                작성일
              </th>
            </tr>
          </thead>
          <tbody>
            {data.list && data.list.length > 0 ? (
              data.list.map((item) => (
                <tr key={item.boardId} style={styles.tr}>
                  <td
                    style={{ ...styles.td, textAlign: "center", color: "#888" }}
                  >
                    {item.boardId}
                  </td>
                  <td style={styles.td}>
                    <Link to={`/detail/${item.boardId}`} style={styles.link}>
                      {item.title}
                    </Link>
                  </td>
                  {/* 📎 첨부파일 표시 컬럼 */}
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    {hasAttachment(item) ? (
                      <span title="첨부파일 있음" style={styles.fileBadge}>
                        📎
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    <span style={styles.authorBadge}>{item.writer}</span>
                  </td>
                  <td
                    style={{
                      ...styles.td,
                      textAlign: "center",
                      color: "#666",
                      fontSize: "0.9rem",
                    }}
                  >
                    {item.createdAt ? item.createdAt.substring(0, 10) : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={styles.emptyTd}>
                  등록된 게시물이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이징 */}
      {totalPages > 0 && (
        <div style={styles.pagination}>
          <button
            disabled={page === 1}
            onClick={() => fetchList(page - 1)}
            style={{ ...styles.pageBtn, opacity: page === 1 ? 0.4 : 1 }}
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchList(p)}
              style={page === p ? styles.activePageBtn : styles.pageBtn}
            >
              {p}
            </button>
          ))}
          <button
            disabled={page === totalPages}
            onClick={() => fetchList(page + 1)}
            style={{
              ...styles.pageBtn,
              opacity: page === totalPages ? 0.4 : 1,
            }}
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  );
}

// 🎨 스타일 객체 (첨부파일 스타일 추가)
const styles = {
  container: {
    maxWidth: "900px",
    margin: "40px auto",
    padding: "30px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
    color: "#1a1a1a",
  },
  subtitle: {
    margin: "4px 0 0 0",
    fontSize: "14px",
    color: "#666",
  },
  highlight: {
    color: "#2563eb",
    fontWeight: "600",
  },
  writeBtn: {
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  searchBar: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    backgroundColor: "#f8fafc",
    padding: "12px",
    borderRadius: "8px",
  },
  select: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    backgroundColor: "#fff",
    outline: "none",
  },
  inputWrapper: {
    flex: 1,
  },
  input: {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  searchBtn: {
    backgroundColor: "#0f172a",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },
  th: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    fontWeight: "600",
    fontSize: "14px",
    padding: "12px 16px",
    borderBottom: "1px solid #e2e8f0",
  },
  tr: {
    borderBottom: "1px solid #f1f5f9",
  },
  td: {
    padding: "14px 16px",
    fontSize: "15px",
    color: "#334155",
  },
  emptyTd: {
    padding: "40px",
    textAlign: "center",
    color: "#94a3b8",
  },
  link: {
    color: "#1e293b",
    textDecoration: "none",
    fontWeight: "500",
  },
  authorBadge: {
    display: "inline-block",
    padding: "3px 8px",
    backgroundColor: "#f1f5f9",
    borderRadius: "12px",
    fontSize: "13px",
    color: "#475569",
  },
  fileBadge: {
    fontSize: "15px",
    cursor: "default",
  },
  pagination: {
    display: "flex",
    justifyContent: "center",
    gap: "6px",
    marginTop: "24px",
  },
  pageBtn: {
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    color: "#475569",
    minWidth: "32px",
    height: "32px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
  },
  activePageBtn: {
    border: "1px solid #2563eb",
    backgroundColor: "#2563eb",
    color: "#fff",
    minWidth: "32px",
    height: "32px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
  },
};

export default BoardList;
