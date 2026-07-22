import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

function BoardDetail() {
  const { id } = useParams();
  const [board, setBoard] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`/api/boards/${id}`)
      .then((res) => setBoard(res.data))
      .catch((err) => console.error(err));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`/api/boards/${id}`);
      alert("삭제되었습니다.");
      navigate("/");
    } catch (err) {
      alert("삭제 실패");
    }
  };

  if (!board) return <div>로딩 중...</div>;

  return (
    <div>
      <h3>{board.title}</h3>
      <p>
        <strong>작성자:</strong> {board.writer} | <strong>작성일:</strong>{" "}
        {board.createdAt?.substring(0, 10)}
      </p>
      <hr />
      <div style={{ minHeight: "150px", whitespace: "pre-wrap" }}>
        {board.content}
      </div>
      <hr />

      {/* 첨부파일 리스트 */}
      <div>
        <h4>첨부파일</h4>
        {board.fileList && board.fileList.length > 0 ? (
          <ul>
            {board.fileList.map((file) => (
              <li key={file.fileId}>
                <a href={`/api/boards/download/${file.fileId}`}>
                  {file.originalName}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p>첨부파일이 없습니다.</p>
        )}
      </div>

      <div style={{ marginTop: "20px" }}>
        <button onClick={() => navigate("/")}>목록</button>
        <button
          onClick={() => navigate(`/edit/${id}`)}
          style={{ marginLeft: "8px" }}
        >
          수정
        </button>
        <button onClick={handleDelete} style={{ marginLeft: "8px" }}>
          삭제
        </button>
      </div>
    </div>
  );
}

export default BoardDetail;
