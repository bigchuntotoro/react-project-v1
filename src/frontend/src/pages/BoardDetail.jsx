import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function BoardDetail() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/boards/${id}`)
      .then((res) => {
        setBoard(res.data);
      })
      .catch((err) => {
        console.error("게시글 로딩 실패:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("정말 이 게시글을 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`/api/boards/${id}`);
      alert("게시글이 삭제되었습니다.");
      navigate("/");
    } catch (err) {
      alert("삭제 실패: " + (err.response?.data || err.message));
    }
  };

  // 💡 이미지 파일 여부 확인 함수
  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const ext = fileName.split(".").pop().toLowerCase();
    return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"].includes(ext);
  };

  // 스켈레톤/로딩 상태
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingWrapper}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: "12px", color: "#64748b" }}>
            게시글을 불러오는 중입니다...
          </p>
        </div>
      </div>
    );
  }

  // 게시글 데이터가 없는 경우
  if (!board) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyWrapper}>
          <p style={{ fontSize: "18px", color: "#64748b" }}>
            게시글을 찾을 수 없습니다.
          </p>
          <button style={styles.listBtn} onClick={() => navigate("/")}>
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 이미지 파일만 필터링
  const imageFiles = board.fileList?.filter((file) =>
    isImageFile(file.originalName),
  );

  return (
    <div style={styles.container}>
      {/* 1. 상단 제목 & 메타 정보 */}
      <div style={styles.header}>
        <h2 style={styles.title}>{board.title}</h2>
        <div style={styles.metaBox}>
          <div style={styles.metaLeft}>
            <span style={styles.authorBadge}>👤 {board.writer}</span>
            <span style={styles.date}>
              📅 {board.createdAt ? board.createdAt.substring(0, 10) : "-"}
            </span>
          </div>
          {(board.readCount !== undefined || board.viewCount !== undefined) && (
            <span style={styles.views}>
              👁️ 조회 {board.readCount ?? board.viewCount}
            </span>
          )}
        </div>
      </div>

      {/* 2. 첨부파일 다운로드 영역 (위치 변경: 본문 위로 이동) */}
      {board.fileList && board.fileList.length > 0 && (
        <div style={styles.fileSection}>
          <div style={styles.fileTitle}>
            📎 첨부파일 ({board.fileList.length})
          </div>
          <div style={styles.fileGrid}>
            {board.fileList.map((file) => (
              <a
                key={file.fileId}
                href={`/api/boards/download/${file.fileId}`}
                style={styles.fileCard}
                download
              >
                <div style={styles.fileInfo}>
                  {isImageFile(file.originalName) ? (
                    <img
                      src={`/api/boards/download/${file.fileId}`}
                      alt={file.originalName}
                      style={styles.fileThumb}
                    />
                  ) : (
                    <span style={{ fontSize: "16px" }}>📁</span>
                  )}
                  <span style={styles.fileName}>{file.originalName}</span>
                </div>
                <span style={styles.downloadIcon}>💾 다운로드</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 3. 본문 영역 */}
      <div style={styles.contentContainer}>
        {/* 3-1. 이미지 파일이 있으면 본문 최상단에 큰 이미지 미리보기 표시 */}
        {imageFiles && imageFiles.length > 0 && (
          <div style={styles.imageGallery}>
            {imageFiles.map((img) => (
              <div key={img.fileId} style={styles.imageWrapper}>
                <img
                  src={`/api/boards/download/${img.fileId}`}
                  alt={img.originalName}
                  style={styles.previewImage}
                />
              </div>
            ))}
          </div>
        )}

        {/* 3-2. 텍스트 본문 */}
        <div style={styles.contentBox}>{board.content}</div>
      </div>

      {/* 4. 하단 버튼 영역 */}
      <div style={styles.footer}>
        <button style={styles.listBtn} onClick={() => navigate("/")}>
          ☰ 목록보기
        </button>
        <div style={styles.actionBtns}>
          <button
            style={styles.editBtn}
            onClick={() => navigate(`/edit/${id}`)}
          >
            ✏️ 수정
          </button>
          <button style={styles.deleteBtn} onClick={handleDelete}>
            🗑️ 삭제
          </button>
        </div>
      </div>
    </div>
  );
}

// 🎨 스타일 객체
const styles = {
  container: {
    maxWidth: "850px",
    margin: "40px auto",
    padding: "36px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    borderBottom: "2px solid #f1f5f9",
    paddingBottom: "20px",
    marginBottom: "20px",
  },
  title: {
    margin: "0 0 16px 0",
    fontSize: "24px",
    fontWeight: "700",
    color: "#0f172a",
    lineHeight: "1.4",
  },
  metaBox: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    color: "#64748b",
  },
  metaLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  authorBadge: {
    backgroundColor: "#f1f5f9",
    padding: "4px 10px",
    borderRadius: "6px",
    fontWeight: "600",
    color: "#334155",
  },
  date: {
    color: "#64748b",
  },
  views: {
    fontSize: "13px",
    color: "#94a3b8",
  },
  fileSection: {
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    padding: "16px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
  },
  fileTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#475569",
    marginBottom: "10px",
  },
  fileGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  fileCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: "10px 14px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    textDecoration: "none",
    transition: "all 0.2s",
  },
  fileInfo: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  fileThumb: {
    width: "32px",
    height: "32px",
    objectFit: "cover",
    borderRadius: "4px",
    border: "1px solid #e2e8f0",
  },
  fileName: {
    fontSize: "14px",
    color: "#1e293b",
    fontWeight: "500",
  },
  downloadIcon: {
    fontSize: "13px",
    color: "#2563eb",
    fontWeight: "600",
  },
  contentContainer: {
    padding: "8px 0",
  },
  imageGallery: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "20px",
  },
  imageWrapper: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderRadius: "8px",
    overflow: "hidden",
    border: "1px solid #f1f5f9",
  },
  previewImage: {
    width: "100%",
    maxHeight: "600px",
    objectFit: "contain",
    display: "block",
  },
  contentBox: {
    minHeight: "180px",
    fontSize: "16px",
    lineHeight: "1.8",
    color: "#334155",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "32px",
    paddingTop: "20px",
    borderTop: "1px solid #f1f5f9",
  },
  listBtn: {
    backgroundColor: "#f1f5f9",
    color: "#334155",
    border: "1px solid #cbd5e1",
    padding: "10px 18px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  actionBtns: {
    display: "flex",
    gap: "8px",
  },
  editBtn: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  deleteBtn: {
    backgroundColor: "#ef4444",
    color: "#ffffff",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  loadingWrapper: {
    padding: "60px 0",
    textAlign: "center",
  },
  emptyWrapper: {
    padding: "60px 0",
    textAlign: "center",
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    margin: "0 auto",
    animation: "spin 1s linear infinite",
  },
};

export default BoardDetail;
