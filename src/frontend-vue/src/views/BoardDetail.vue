<template>
  <section>
    <div v-if="loading" class="state">불러오는 중입니다...</div>

    <div v-else-if="error" class="state error">
      {{ error }}
    </div>

    <article v-else class="detail">
      <!-- 게시글 정보 -->
      <div class="detail-header">
        <h1>{{ board.title }}</h1>

        <div class="meta">
          <span>작성자 {{ board.writer }}</span>
          <span>{{ formatDate(board.createdAt) }}</span>
          <span>조회 {{ board.readCnt ?? 0 }}</span>
        </div>
      </div>

      <!-- 게시글 내용 -->
      <div class="content">
        {{ board.content }}
      </div>

      <!-- ================================================= -->
      <!-- 이미지 미리보기 -->
      <!-- ================================================= -->
      <div v-if="imageFiles.length" class="image-gallery">
        <h3>이미지 미리보기</h3>

        <div class="image-grid">
          <div v-for="file in imageFiles" :key="file.fileId" class="image-item">
            <!-- Blob URL이 생성된 경우에만 이미지 표시 -->
            <img
              v-if="blobUrlMap[file.fileId]"
              :src="blobUrlMap[file.fileId]"
              :alt="file.originalName"
            />

            <!-- 이미지 로딩 중 -->
            <div v-else class="image-loading">이미지 불러오는 중...</div>

            <span class="img-name">
              {{ file.originalName }}
            </span>
          </div>
        </div>
      </div>

      <!-- ================================================= -->
      <!-- 첨부파일 -->
      <!-- ================================================= -->
      <div v-if="files.length" class="files">
        <h3>첨부파일 목록 ({{ files.length }})</h3>

        <ul class="file-list">
          <li v-for="file in files" :key="file.fileId" class="file-item">
            <a href="#" @click.prevent="downloadFile(file)">
              <span class="file-icon">
                {{ getFileIcon(file.originalName) }}
              </span>

              <span class="file-name">
                {{ file.originalName }}
              </span>

              <small class="file-size">
                ({{ formatSize(file.fileSize) }})
              </small>
            </a>
          </li>
        </ul>
      </div>

      <!-- 버튼 -->
      <div class="actions">
        <router-link to="/boards" class="btn"> 목록 </router-link>

        <router-link :to="`/boards/${id}/edit`" class="btn"> 수정 </router-link>

        <button class="btn danger" @click="remove">삭제</button>
      </div>
    </article>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

import { useRouter } from "vue-router";

// ❌ 일반 axios 사용하지 않음
// import axios from "axios";

// ✅ JWT interceptor가 적용된 api 사용
import api, { getBoard, deleteBoard } from "../api/boardApi";

/* =========================================================
   Props
========================================================= */

const props = defineProps({
  id: [String, Number],
});

const router = useRouter();

/* =========================================================
   State
========================================================= */

const board = ref({});
const files = ref([]);

const loading = ref(true);
const error = ref("");

/*
 * 이미지 Blob URL 캐시
 *
 * {
 *   1: "blob:http://localhost:5173/....",
 *   2: "blob:http://localhost:5173/...."
 * }
 */
const blobUrlMap = ref({});

/* =========================================================
   이미지 확장자
========================================================= */

const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];

/* =========================================================
   이미지 파일만 추출
========================================================= */

const imageFiles = computed(() => {
  return files.value.filter((file) => {
    if (!file.originalName) {
      return false;
    }

    const ext = file.originalName.split(".").pop().toLowerCase();

    return imageExtensions.includes(ext);
  });
});

/* =========================================================
   게시글 조회
========================================================= */

async function load() {
  loading.value = true;
  error.value = "";

  try {
    const { data } = await getBoard(props.id);

    console.log("[BoardDetail] 게시글 데이터:", data);

    board.value = data;

    /*
     * BoardDto의 fileList 사용
     *
     * BoardService / Mapper에서
     * fileList가 정상적으로 들어오는 것이 가장 좋음
     */
    files.value = data.fileList ?? data.files ?? data.boardFiles ?? [];

    console.log("[BoardDetail] 첨부파일:", files.value);

    /*
     * 이미지 Blob 로딩
     */
    await loadImageBlobs();
  } catch (e) {
    console.error("[BoardDetail] 게시글 조회 실패:", e);

    if (e.response?.status === 401) {
      error.value = "로그인이 필요하거나 세션이 만료되었습니다.";
    } else {
      error.value =
        e.response?.data?.message || "게시글을 불러오지 못했습니다.";
    }
  } finally {
    loading.value = false;
  }
}

/* =========================================================
   이미지 Blob 로딩
========================================================= */

async function loadImageBlobs() {
  /*
   * 기존에 생성된 Blob URL 제거
   */
  Object.values(blobUrlMap.value).forEach((url) => {
    if (url) {
      window.URL.revokeObjectURL(url);
    }
  });

  blobUrlMap.value = {};

  /*
   * 이미지 파일 하나씩 로딩
   */
  for (const file of imageFiles.value) {
    try {
      console.log("[Image] 요청:", fileUrl(file));

      /*
       * 중요
       *
       * 일반 axios가 아니라
       * boardApi의 api 인스턴스를 사용합니다.
       *
       * api에는 JWT Request Interceptor가
       * 등록되어 있습니다.
       */
      const response = await api.get(fileUrl(file), {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(response.data);

      blobUrlMap.value[file.fileId] = url;
    } catch (e) {
      console.error("[Image] 이미지 불러오기 실패:", file.originalName, e);
    }
  }
}

/* =========================================================
   파일 다운로드
========================================================= */

async function downloadFile(file) {
  try {
    console.log("[Download] 요청:", fileUrl(file));

    /*
     * 중요
     *
     * 일반 axios ❌
     *
     * api 인스턴스 사용 ✅
     *
     * → JWT 자동 첨부
     */
    const response = await api.get(fileUrl(file), {
      responseType: "blob",
    });

    /*
     * Blob 생성
     */
    const blob = new Blob([response.data], {
      type: response.headers["content-type"] || "application/octet-stream",
    });

    const url = window.URL.createObjectURL(blob);

    /*
     * 다운로드 링크 생성
     */
    const link = document.createElement("a");

    link.href = url;

    link.download = file.originalName || "download";

    document.body.appendChild(link);

    link.click();

    link.remove();

    /*
     * Blob URL 해제
     */
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 1000);
  } catch (e) {
    console.error("[Download] 다운로드 실패:", e);

    if (e.response?.status === 401) {
      alert("로그인이 필요하거나 세션이 만료되었습니다.");
    } else if (e.response?.status === 404) {
      alert("파일을 찾을 수 없습니다.");
    } else {
      alert(e.response?.data?.message || "파일 다운로드에 실패했습니다.");
    }
  }
}

/* =========================================================
   파일 URL
========================================================= */

function fileUrl(file) {
  if (file.downloadUrl) {
    // downloadUrl이 /api로 시작하면 중복 방지
    if (file.downloadUrl.startsWith("/api/")) {
      return file.downloadUrl.substring(4);
    }

    return file.downloadUrl;
  }

  // boardApi.js의 baseURL이 /api이므로
  // 여기서는 /boards부터 시작해야 함
  return `/boards/download/${file.fileId}`;
}

/* =========================================================
   게시글 삭제
========================================================= */

async function remove() {
  if (!confirm("게시글을 삭제하시겠습니까?")) {
    return;
  }

  try {
    await deleteBoard(props.id);

    router.push("/boards");
  } catch (e) {
    console.error("[BoardDetail] 삭제 실패:", e);

    alert(e.response?.data?.message || "삭제에 실패했습니다.");
  }
}

/* =========================================================
   날짜
========================================================= */

function formatDate(v) {
  return v ? String(v).replace("T", " ").substring(0, 16) : "";
}

/* =========================================================
   파일 크기
========================================================= */

function formatSize(size) {
  if (!size) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];

  let i = 0;
  let n = size;

  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i++;
  }

  return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
}

/* =========================================================
   파일 아이콘
========================================================= */

function getFileIcon(fileName) {
  if (!fileName) {
    return "📁";
  }

  const ext = fileName.split(".").pop().toLowerCase();

  if (imageExtensions.includes(ext)) {
    return "🖼️";
  }

  if (ext === "pdf") {
    return "📕";
  }

  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return "📦";
  }

  if (["doc", "docx", "hwp"].includes(ext)) {
    return "📝";
  }

  if (["xls", "xlsx"].includes(ext)) {
    return "📊";
  }

  if (["ppt", "pptx"].includes(ext)) {
    return "📊";
  }

  return "📎";
}

/* =========================================================
   Blob URL 정리
========================================================= */

onUnmounted(() => {
  Object.values(blobUrlMap.value).forEach((url) => {
    if (url) {
      window.URL.revokeObjectURL(url);
    }
  });
});

/* =========================================================
   시작
========================================================= */

onMounted(load);
</script>

<style scoped>
.detail {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.detail-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
  margin-bottom: 20px;
}

.meta span {
  margin-right: 15px;
  color: #666;
  font-size: 0.9em;
}

.content {
  min-height: 150px;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: 30px;
}

/* =========================================================
   이미지
========================================================= */

.image-gallery {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.image-gallery h3 {
  font-size: 1.1em;
  margin-bottom: 12px;
  color: #333;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.image-item {
  display: flex;
  flex-direction: column;
  width: 300px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fafafa;
}

.image-item img {
  width: 100%;
  height: auto;
  max-height: 250px;
  object-fit: cover;
  display: block;
}

.image-loading {
  width: 100%;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: #f1f5f9;
}

.img-name {
  padding: 6px 10px;
  font-size: 0.8em;
  color: #555;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* =========================================================
   첨부파일
========================================================= */

.files {
  margin-top: 30px;
  padding: 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.files h3 {
  font-size: 1em;
  margin-bottom: 10px;
  color: #475569;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.file-item {
  margin-bottom: 8px;
}

.file-item:last-child {
  margin-bottom: 0;
}

.file-item a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #2563eb;
  text-decoration: none;
  font-size: 0.95em;
}

.file-item a:hover {
  text-decoration: underline;
}

.file-size {
  color: #64748b;
}

/* =========================================================
   버튼
========================================================= */

.actions {
  margin-top: 30px;
  display: flex;
  gap: 10px;
}
</style>
