import axiosInstance from "./axiosInstance";

// 1. 게시글 목록 조회 (페이징 + 검색) -> GET /api/boards
export const getBoardList = async (params) => {
  // params 예시: { page: 1, recordSize: 10, keyword: '검색어' }
  const response = await axiosInstance.get("/api/boards", { params });
  return response.data;
};

// 2. 게시글 상세 조회 -> GET /api/boards/{id}
export const getBoardDetail = async (id) => {
  const response = await axiosInstance.get(`/api/boards/${id}`);
  return response.data;
};

// 3. 게시글 작성 (파일 최대 5개) -> POST /api/boards
// @RequestPart("board")와 @RequestPart("files") 규격 적용
export const createBoard = async (boardData, files = []) => {
  const formData = new FormData();

  // JSON 데이터를 Blob으로 변환하여 'board' 파트에 추가
  const boardBlob = new Blob([JSON.stringify(boardData)], {
    type: "application/json",
  });
  formData.append("board", boardBlob);

  // 'files' 파트에 파일 리스트 추가
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await axiosInstance.post("/api/boards", formData, {
    headers: {
      "Content-Type": "multipart/form-data", // 파일 업로드는 Multipart Form-Data
    },
  });

  return response.data;
};

// 4. 게시글 수정 -> PUT /api/boards/{id}
export const updateBoard = async (
  id,
  boardData,
  files = [],
  deleteFileIds = [],
) => {
  const formData = new FormData();

  const boardBlob = new Blob([JSON.stringify(boardData)], {
    type: "application/json",
  });
  formData.append("board", boardBlob);

  files.forEach((file) => {
    formData.append("files", file);
  });

  // 삭제할 파일 ID 리스트가 있다면 Query Parameter로 추가
  const response = await axiosInstance.put(`/api/boards/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    params: {
      deleteFileIds: deleteFileIds.join(","), // List<Long> 형태 전달
    },
  });

  return response.data;
};

// 5. 게시글 삭제 -> DELETE /api/boards/{id}
export const deleteBoard = async (id) => {
  const response = await axiosInstance.delete(`/api/boards/${id}`);
  return response.data;
};

// 6. 첨부파일 URL 생성 함수 (이미지 미리보기 / 다운로드)
export const getFileUrl = (fileId, isInline = true) => {
  return `http://localhost:8080/api/boards/download/${fileId}?inline=${isInline}`;
};
