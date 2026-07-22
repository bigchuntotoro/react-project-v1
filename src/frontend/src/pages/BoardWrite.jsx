import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function BoardWrite() {
  const [form, setForm] = useState({ title: "", writer: "", content: "" });
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // 파일 선택 처리 (최대 5개 제한)
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (files.length + selectedFiles.length > 5) {
      alert("첨부파일은 최대 5개까지 등록할 수 있습니다.");
      e.target.value = ""; // 💡 제한 초과 시에도 input을 초기화해야 재선택이 가능합니다.
      return;
    }

    setFiles((prev) => [...prev, ...selectedFiles]);
    e.target.value = ""; // input 초기화
  };

  // 선택한 파일 개별 삭제
  const handleRemoveFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  // 폼 제출 처리
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.writer.trim() || !form.content.trim()) {
      alert("모든 필수 항목(제목, 작성자, 내용)을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    // JSON 데이터를 Blob으로 만들어 application/json 타입임을 명시
    formData.append(
      "board",
      new Blob([JSON.stringify(form)], { type: "application/json" }),
    );

    // 파일이 존재할 때만 formData에 추가
    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      // Axios가 boundary를 포함한 Content-Type을 자동으로 헤더에 세팅합니다.
      await axios.post("/api/boards", formData);
      alert("게시글이 성공적으로 등록되었습니다.");
      navigate("/");
    } catch (err) {
      const errorMsg = err.response?.data || err.message || "알 수 없는 오류";
      alert("등록 실패: " + errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* 헤더 */}
      <div style={styles.header}>
        <h2 style={styles.title}>✏️ 새 글 작성</h2>
        <p style={styles.subtitle}>
          게시글 정보와 필요한 첨부파일을 입력해 주세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {/* 제목 & 작성자 (2열 배치) */}
        <div style={styles.row}>
          <div style={{ ...styles.inputGroup, flex: 2 }}>
            <label style={styles.label}>
              제목 <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              placeholder="제목을 입력해 주세요"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={styles.input}
            />
          </div>

          <div style={{ ...styles.inputGroup, flex: 1 }}>
            <label style={styles.label}>
              작성자 <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              placeholder="작성자 이름"
              value={form.writer}
              onChange={(e) => setForm({ ...form, writer: e.target.value })}
              style={styles.input}
            />
          </div>
        </div>

        {/* 본문 내용 */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            내용 <span style={styles.required}>*</span>
          </label>
          <textarea
            rows="12"
            placeholder="내용을 정성껏 작성해 주세요..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            style={styles.textarea}
          />
        </div>

        {/* 첨부파일 섹션 */}
        <div style={styles.fileSection}>
          <div style={styles.fileHeader}>
            <label style={styles.label}>
              첨부파일 <span style={styles.fileCount}>({files.length}/5)</span>
            </label>
            <label
              htmlFor="file-upload"
              style={
                files.length >= 5 ? styles.uploadBtnDisabled : styles.uploadBtn
              }
            >
              📎 파일 선택
            </label>
            <input
              id="file-upload"
              type="file"
              multiple
              disabled={files.length >= 5}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          {/* 첨부된 파일 목록 */}
          {files.length > 0 && (
            <div style={styles.fileList}>
              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} style={styles.fileItem}>
                  <span style={styles.fileName}>
                    📁 {file.name}{" "}
                    <span style={styles.fileSize}>
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    style={styles.removeFileBtn}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 버튼 영역 */}
        <div style={styles.buttonGroup}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={styles.cancelBtn}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={isSubmitting ? styles.submitBtnDisabled : styles.submitBtn}
          >
            {isSubmitting ? "등록 중..." : "게시글 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}

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
    border: "1px dashed #cbd5e1",
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
    backgroundColor: "#ffffff",
    padding: "8px 12px",
    borderRadius: "6px",
    border: "1px solid #e2e8f0",
  },
  fileName: {
    fontSize: "13px",
    color: "#1e293b",
  },
  fileSize: {
    color: "#94a3b8",
    fontSize: "12px",
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
};

export default BoardWrite;
