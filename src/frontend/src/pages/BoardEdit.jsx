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

  useEffect(() => {
    axios.get(`/api/boards/${id}`).then((res) => {
      setForm({
        title: res.data.title,
        content: res.data.content,
        writer: res.data.writer,
      });
      setExistingFiles(res.data.fileList || []);
    });
  }, [id]);

  const toggleDeleteFile = (fileId) => {
    if (deleteFileIds.includes(fileId)) {
      setDeleteFileIds(deleteFileIds.filter((fId) => fId !== fileId));
    } else {
      setDeleteFileIds([...deleteFileIds, fileId]);
    }
  };

  const handleNewFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const remainingExistingCount = existingFiles.length - deleteFileIds.length;
    if (remainingExistingCount + selected.length > 5) {
      alert("기존 파일과 합쳐 총 첨부파일은 최대 5개까지 가능합니다.");
      e.target.value = "";
      return;
    }
    setNewFiles(selected);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append(
      "board",
      new Blob([JSON.stringify(form)], { type: "application/json" }),
    );

    newFiles.forEach((file) => formData.append("files", file));
    deleteFileIds.forEach((fId) => formData.append("deleteFileIds", fId));

    try {
      await axios.put(`/api/boards/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("수정되었습니다.");
      navigate(`/detail/${id}`);
    } catch (err) {
      alert("수정 실패: " + (err.response?.data || err.message));
    }
  };

  return (
    <div>
      <h3>글 수정</h3>
      <form
        onSubmit={handleUpdate}
        style={{ display: "flex", flexDirection: "column", gap: "10px" }}
      >
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          rows="10"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />

        {/* 기존 파일 리스트 및 삭제 체크 */}
        <div>
          <h4>기존 첨부파일</h4>
          {existingFiles.length > 0 ? (
            existingFiles.map((f) => (
              <div key={f.fileId} style={{ marginBottom: "5px" }}>
                <span
                  style={{
                    textDecoration: deleteFileIds.includes(f.fileId)
                      ? "line-through"
                      : "none",
                  }}
                >
                  {f.originalName}
                </span>
                <button
                  type="button"
                  onClick={() => toggleDeleteFile(f.fileId)}
                  style={{ marginLeft: "10px" }}
                >
                  {deleteFileIds.includes(f.fileId) ? "삭제 취소" : "삭제 선택"}
                </button>
              </div>
            ))
          ) : (
            <p>기존 첨부파일 없음</p>
          )}
        </div>

        {/* 새 파일 추가 */}
        <div>
          <label>추가 첨부파일: </label>
          <input type="file" multiple onChange={handleNewFileChange} />
        </div>

        <div>
          <button type="submit">저장</button>
          <button
            type="button"
            onClick={() => navigate(`/detail/${id}`)}
            style={{ marginLeft: "8px" }}
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

export default BoardEdit;
