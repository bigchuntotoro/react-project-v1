import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function BoardWrite() {
  const [form, setForm] = useState({ title: "", writer: "", content: "" });
  const [files, setFiles] = useState([]);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 5) {
      alert("첨부파일은 최대 5개까지 가능합니다.");
      e.target.value = "";
      return;
    }
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.writer || !form.content) {
      alert("모든 필드를 입력하세요.");
      return;
    }

    const formData = new FormData();
    formData.append(
      "board",
      new Blob([JSON.stringify(form)], { type: "application/json" }),
    );

    files.forEach((file) => {
      formData.append("files", file);
    });

    try {
      await axios.post("/api/boards", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("게시글이 등록되었습니다.");
      navigate("/");
    } catch (err) {
      alert("등록 실패: " + (err.response?.data || err.message));
    }
  };

  return (
    <div>
      <h3>글쓰기</h3>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <input
          type="text"
          placeholder="제목"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="작성자"
          value={form.writer}
          onChange={(e) => setForm({ ...form, writer: e.target.value })}
        />
        <textarea
          rows="10"
          placeholder="내용"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
        <div>
          <label>첨부파일 (최대 5개): </label>
          <input type="file" multiple onChange={handleFileChange} />
        </div>
        <div>
          <button type="submit">등록</button>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{ marginLeft: "8px" }}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

export default BoardWrite;
