import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function BoardEdit() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: "", content: "", writer: "" });
  const [existingFiles, setExistingFiles] = useState([]);
  const [deleteFileIds, setDeleteFileIds] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`/api/boards/${id}`)
      .then((res) => {
        setForm({
          title: res.data.title || "",
          content: res.data.content || "",
          writer: res.data.writer || "",
        });
        setExistingFiles(res.data.fileList || []);
      })
      .catch((err) => {
        console.error("게시글 정보를 불러오지 못했습니다:", err);
        alert("게시글 정보를 불러오는데 실패했습니다.");
        navigate("/");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, navigate]);

  // 기존 파일 삭제 지정 토글
  const toggleDeleteFile = (fileId) => {
    if (deleteFileIds.includes(fileId)) {
      setDeleteFileIds(deleteFileIds.filter((fId) => fId !== fileId));
    } else {
      setDeleteFileIds([...deleteFileIds, fileId]);
    }
  };

  // 새로 추가할 파일 선택 처리 (기존 남은 파일 + 신규 파일 <= 5개)
  const handleNewFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const remainingExistingCount = existingFiles.length - deleteFileIds.length;

    if (remainingExistingCount + newFiles.length + selected.length > 5) {
      alert("기존 파일과 합쳐 총 첨부파일은 최대 5개까지 가능합니다.");
      e.target.value = "";
      return;
    }

    setNewFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };

  // 새로 선택한 파일 삭제
  const handleRemoveNewFile = (indexToRemove) => {
    setNewFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // 수정 제출
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      alert("제목과 내용을 모두 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append(
      "board",
      new Blob([JSON.stringify(form)], { type: "application/json" }),
    );

    newFiles.forEach((file) => formData.append("files", file));
    deleteFileIds.forEach((fId) => formData.append("deleteFileIds", fId));

    try {
      // Axios가 FormData를 감지해 Content-Type 및 boundary를 자동 설정하도록 headers 명시는 생략합니다.
      await axios.put(`/api/boards/${id}`, formData);
      alert("게시글이 수정되었습니다.");
      navigate(`/detail/${id}`);
    } catch (err) {
      alert("수정 실패: " + (err.response?.data || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingWrapper}>
          <div style={styles.spinner}></div>
          <p style={{ marginTop: "12px", color: "#64748b" }}>
            게시글 데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  const activeExistingCount = existingFiles.length - deleteFileIds.length;
  const totalFileCount = activeExistingCount + newFiles.length;

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <h2 style={styles.title}>✏️ 게시글 수정</h2>
        <p style={styles.subtitle}>
          수정할 내용과 첨부파일을 확인 및 변경해 주세요.
        </p>
      </div>

      <form onSubmit={handleUpdate} style={styles.form}>
        {/* 제목 & 작성자 (작성자는 읽기 전용) */}
        <div style={styles.row}>
          <div style={{ ...styles.inputGroup, flex: 2 }}>
            <label style={styles.label}>
              제목 <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <label style={styles.label}>작성자</label>
            <input
              type="text"
              value={form.writer}
              disabled
              style={{
                ...styles.input,
                backgroundColor: "#f1f5f9",
                color: "#64748b",
              }}
            />
          </div>
        </div>

        {/* 내용 */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            내용 <span style={styles.required}>*</span>
          </label>
          <textarea
            rows="12"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            style={styles.textarea}
          />
        </div>

        {/* 1. 기존 첨부파일 목록 및 삭제 지정 */}
        <div style={styles.fileSection}>
          <div style={styles.fileHeader}>
            <label style={styles.label}>
              기존 첨부파일 ({existingFiles.length})
            </label>
          </div>

          {existingFiles.length > 0 ? (
            <div style={styles.fileList}>
              {existingFiles.map((f) => {
                const isMarkedDelete = deleteFileIds.includes(f.fileId);
                return (
                  <div
                    key={f.fileId}
                    style={{
                      ...styles.fileItem,
                      backgroundColor: isMarkedDelete ? "#fef2f2" : "#ffffff",
                      borderColor: isMarkedDelete ? "#fca5a5" : "#e2e8f0",
                    }}
                  >
                    <span
                      style={{
                        ...styles.fileName,
                        textDecoration: isMarkedDelete
                          ? "line-through"
                          : "none",
                        color: isMarkedDelete ? "#ef4444" : "#1e293b",
                      }}
                    >
                      📁 {f.originalName}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleDeleteFile(f.fileId)}
                      style={
                        isMarkedDelete
                          ? styles.cancelDeleteBtn
                          : styles.markDeleteBtn
                      }
                    >
                      {isMarkedDelete ? "삭제 취소" : "삭제 선택"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={styles.emptyText}>기존 첨부파일이 없습니다.</p>
          )}
        </div>

        {/* 2. 신규 파일 추가 */}
        <div style={styles.fileSection}>
          <div style={styles.fileHeader}>
            <label style={styles.label}>
              추가 첨부파일{" "}
              <span style={styles.fileCount}>({totalFileCount}/5)</span>
            </label>
            <label
              htmlFor="new-file-upload"
              style={
                totalFileCount >= 5
                  ? styles.uploadBtnDisabled
                  : styles.uploadBtn
              }
            >
              📎 파일 선택
            </label>
            <input
              id="new-file-upload"
              type="file"
              multiple
              disabled={totalFileCount >= 5}
              onChange={handleNewFileChange}
              style={{ display: "none" }}
            />
          </div>

          {newFiles.length > 0 && (
            <div style={styles.fileList}>
              {newFiles.map((file, index) => (
                <div key={index} style={styles.fileItem}>
                  <span style={styles.fileName}>
                    ✨ [신규] {file.name}{" "}
                    <span style={styles.fileSize}>
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveNewFile(index)}
                    style={styles.removeFileBtn}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div style={styles.buttonGroup}>
          <button
            type="button"
            onClick={() => navigate(`/detail/${id}`)}
            style={styles.cancelBtn}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={isSubmitting ? styles.submitBtnDisabled : styles.submitBtn}
          >
            {isSubmitting ? "저장 중..." : "수정 완료"}
          </button>
        </div>
      </form>
    </div>
  );
}

// 🎨 스타일 객체 (전체 컴포넌트 공통 디자인)
const styles = {
  container: {
    maxWidth: "800px",
    margin: "40px auto",
    padding: "36px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
    fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    marginBottom: "28px",
    borderBottom: "1px solid #f1f5f9",
    paddingBottom: "16px",
  },
  title: {
    margin: 0,
    fontSize: "22px",
    fontWeight: "700",
    color: "#0f172a",
  },
  subtitle: {
    margin: "6px 0 0 0",
    fontSize: "14px",
    color: "#64748b",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  row: {
    display: "flex",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
  },
  required: {
    color: "#ef4444",
  },
  input: {
    padding: "10px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "14px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    boxSizing: "border-box",
  },
  fileSection: {
    backgroundColor: "#f8fafc",
    padding: "16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
  },
  fileHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fileCount: {
    fontSize: "13px",
    fontWeight: "normal",
    color: "#64748b",
  },
  uploadBtn: {
    backgroundColor: "#ffffff",
    border: "1px solid #cbd5e1",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    fontWeight: "500",
    color: "#334155",
    cursor: "pointer",
  },
  uploadBtnDisabled: {
    backgroundColor: "#f1f5f9",
    border: "1px solid #e2e8f0",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "13px",
    color: "#94a3b8",
    cursor: "not-allowed",
  },
  fileList: {
    marginTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  fileItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
    transition: "all 0.2s",
  },
  fileName: {
    fontSize: "13px",
  },
  fileSize: {
    color: "#94a3b8",
    fontSize: "12px",
  },
  emptyText: {
    margin: "10px 0 0 0",
    fontSize: "13px",
    color: "#94a3b8",
  },
  markDeleteBtn: {
    backgroundColor: "#ffffff",
    border: "1px solid #fca5a5",
    color: "#ef4444",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    cursor: "pointer",
  },
  cancelDeleteBtn: {
    backgroundColor: "#ef4444",
    border: "none",
    color: "#ffffff",
    padding: "4px 8px",
    borderRadius: "4px",
    fontSize: "12px",
    cursor: "pointer",
  },
  removeFileBtn: {
    background: "none",
    border: "none",
    color: "#ef4444",
    cursor: "pointer",
    fontSize: "14px",
    padding: "0 4px",
  },
  buttonGroup: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "12px",
  },
  cancelBtn: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    backgroundColor: "#ffffff",
    color: "#475569",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  submitBtn: {
    padding: "10px 24px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
  submitBtnDisabled: {
    padding: "10px 24px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#93c5fd",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "not-allowed",
  },
  loadingWrapper: {
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

export default BoardEdit;
