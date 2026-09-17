<template>
  <section class="board-container">
    <div class="page-title">
      <div>
        <h1>게시판</h1>
        <p>Spring Boot + MyBatis 게시판</p>
      </div>
      <router-link to="/boards/write" class="btn primary">글쓰기</router-link>
    </div>

    <!-- 🔍 검색 영역 (모바일 대응 플렉스 수정) -->
    <div class="search-box">
      <select v-model="searchType">
        <option value="title">제목</option>
        <option value="content">내용</option>
        <option value="writer">작성자</option>
        <option value="titleContent">제목+내용</option>
      </select>
      <input
        v-model="keyword"
        @keyup.enter="search"
        placeholder="검색어를 입력하세요"
      />
      <button class="btn search-btn" @click="search">검색</button>
    </div>

    <div v-if="loading" class="state">게시글을 불러오는 중입니다...</div>
    <div v-else-if="error" class="state error">{{ error }}</div>

    <!-- 📋 테이블 영역 (가로 스크롤 및 너비 고정) -->
    <div v-else class="table-wrap">
      <table class="board-table">
        <thead>
          <tr>
            <th class="col-num">번호</th>
            <th class="col-title">제목</th>
            <th class="col-file">첨부</th>
            <th class="col-writer mobile-hide">작성자</th>
            <th class="col-date">작성일</th>
            <th class="col-views mobile-hide">조회</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="boards.length === 0">
            <td colspan="6" class="empty">게시글이 없습니다.</td>
          </tr>
          <tr v-for="board in boards" :key="board.boardId">
            <td class="col-num">{{ board.boardId }}</td>
            <td class="col-title subject">
              <router-link :to="`/boards/${board.boardId}`">
                {{ board.title }}
              </router-link>
            </td>
            <td class="col-file">
              <span
                v-if="getFileCount(board) > 0"
                class="file-badge"
                title="첨부파일 있음"
              >
                📎 <small>{{ getFileCount(board) }}</small>
              </span>
              <span v-else class="no-file">-</span>
            </td>
            <td class="col-writer mobile-hide">{{ board.writer }}</td>
            <td class="col-date">{{ formatDate(board.createdAt) }}</td>
            <td class="col-views mobile-hide">{{ board.readCnt ?? 0 }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination :page="page" :total-pages="totalPages" @change="changePage" />
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getBoards } from "../api/boardApi";
import Pagination from "../components/Pagination.vue";

const boards = ref([]);
const page = ref(1);
const recordSize = 10;
const totalPages = ref(1);
const loading = ref(false);
const error = ref("");
const searchType = ref("title");
const keyword = ref("");

function getFileCount(board) {
  if (!board) return 0;
  if (board.fileCount !== undefined && board.fileCount !== null) {
    const n = Number(board.fileCount);
    return Number.isNaN(n) ? 0 : n;
  }
  if (Array.isArray(board.fileList)) return board.fileList.length;
  if (Array.isArray(board.files)) return board.files.length;
  return 0;
}

async function loadBoards() {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await getBoards({
      page: page.value,
      recordSize,
      searchType: searchType.value,
      keyword: keyword.value,
    });

    boards.value = data.list ?? data.content ?? data.boards ?? [];
    const totalCount = data.totalCount ?? 0;
    const size = data.recordSize ?? recordSize;
    totalPages.value = Math.max(1, Math.ceil(totalCount / size));
  } catch (e) {
    error.value = e.response?.data?.message || "게시글을 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
}

function search() {
  page.value = 1;
  loadBoards();
}

function changePage(p) {
  page.value = p;
  loadBoards();
}

function formatDate(value) {
  if (!value) return "";
  return String(value).substring(0, 10);
}

onMounted(loadBoards);
</script>

<style scoped>
/* 전체 레이아웃 컨테이너 */
.board-container {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem;
  box-sizing: border-box;
}

.page-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.page-title h1 {
  font-size: 1.5rem;
  font-weight: 700;
}

.page-title p {
  font-size: 0.85rem;
  color: #666;
}

/* 🔍 검색창 스타일 수정 (모바일에서 세로 정렬 및 터치 편의성 확보) */
.search-box {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  width: 100%;
}

.search-box select,
.search-box input,
.search-box .search-btn {
  padding: 0.6rem 0.75rem;
  font-size: 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
  background-color: #fff;
}

.search-box select {
  flex-shrink: 0;
  width: 100px;
}

.search-box input {
  flex: 1;
  min-width: 0; /* flex 내부에서 input이 깨지는 현상 방지 */
}

.search-box .search-btn {
  flex-shrink: 0;
  background-color: #2b6cb0;
  color: #fff;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

/* 📋 테이블 래퍼 및 스타일 (줄바꿈 방지 및 스크롤) */
.table-wrap {
  width: 100%;
  overflow-x: auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.board-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed; /* 컬럼 너비를 고정하여 텍스트 밀림 방지 */
}

th,
td {
  padding: 12px 8px;
  text-align: center;
  border-bottom: 1px solid #eee;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #333;
}

/* 각 컬럼별 고정 너비 설정 */
.col-num {
  width: 12%;
}
.col-title {
  width: 48%;
  text-align: left;
}
.col-file {
  width: 15%;
}
.col-date {
  width: 25%;
}
.col-writer,
.col-views {
  width: 15%;
}

.subject a {
  color: #333;
  text-decoration: none;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subject a:hover {
  text-decoration: underline;
}

.file-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2b6cb0;
  font-weight: bold;
}

.no-file {
  color: #ccc;
}

/* 📱 모바일 화면 최적화 (768px 이하) */
@media (max-width: 768px) {
  .board-container {
    padding: 0.5rem;
  }

  /* 스마트폰에서는 작성자와 조회 컬럼을 숨겨서 여유 확보 */
  .mobile-hide {
    display: none !important;
  }

  /* 컬럼 너비 재조정 (모바일에서 숨겨진 컬럼 몫을 제목과 날짜에 배분) */
  .col-num {
    width: 15%;
  }
  .col-title {
    width: 55%;
  }
  .col-file {
    width: 15%;
  }
  .col-date {
    width: 15%;
  }

  th,
  td {
    padding: 10px 4px;
    font-size: 12px;
  }
}
</style>
