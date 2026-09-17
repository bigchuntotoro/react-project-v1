<template>
  <section>
    <h1>게시글 수정</h1>

    <div v-if="loading" class="state">불러오는 중입니다...</div>
    <form v-else class="form" @submit.prevent="submit">
      <label>제목</label>
      <input v-model="form.title" maxlength="200" required />

      <label>작성자</label>
      <input
        v-model="form.writer"
        maxlength="50"
        required
        readonly
        class="input-locked"
      />

      <label>내용</label>
      <textarea v-model="form.content" rows="14" required></textarea>

      <!-- ================================================= -->
      <!-- 기존 이미지 미리보기 -->
      <!-- ================================================= -->
      <div v-if="existingImageFiles.length" class="image-gallery">
        <h3>등록된 이미지</h3>

        <div class="image-grid">
          <div
            v-for="file in existingImageFiles"
            :key="file.fileId"
            class="image-item"
            :class="{ 'marked-delete': deleteFileIds.includes(file.fileId) }"
          >
            <img
              v-if="blobUrlMap[file.fileId]"
              :src="blobUrlMap[file.fileId]"
              :alt="file.originalName"
            />
            <div v-else class="image-loading">이미지 불러오는 중...</div>

            <span class="img-name">{{ file.originalName }}</span>

            <label class="delete-check">
              <input
                type="checkbox"
                :checked="deleteFileIds.includes(file.fileId)"
                @change="toggleDelete(file.fileId)"
              />
              삭제
            </label>
          </div>
        </div>
      </div>

      <!-- ================================================= -->
      <!-- 기존 첨부파일 (이미지 제외) -->
      <!-- ================================================= -->
      <div v-if="existingOtherFiles.length" class="files">
        <h3>등록된 첨부파일 ({{ existingOtherFiles.length }})</h3>

        <ul class="file-list">
          <li
            v-for="file in existingOtherFiles"
            :key="file.fileId"
            class="file-item"
            :class="{ 'marked-delete': deleteFileIds.includes(file.fileId) }"
          >
            <span class="file-icon">{{ getFileIcon(file.originalName) }}</span>
            <span class="file-name">{{ file.originalName }}</span>
            <small class="file-size">({{ formatSize(file.fileSize) }})</small>

            <label class="delete-check">
              <input
                type="checkbox"
                :checked="deleteFileIds.includes(file.fileId)"
                @change="toggleDelete(file.fileId)"
              />
              삭제
            </label>
          </li>
        </ul>
      </div>

      <label>추가 첨부파일 (최대 5개)</label>
      <input type="file" multiple @change="onFiles" />
      <div class="selected-files" v-if="selectedFiles.length">
        <span v-for="file in selectedFiles" :key="file.name">
          {{ file.name }}
        </span>
      </div>

      <div class="actions">
        <router-link :to="`/boards/${props.id}`" class="btn">취소</router-link>
        <button class="btn primary" :disabled="saving">
          {{ saving ? "수정 중..." : "수정" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import api, { getBoard, updateBoard } from "../api/boardApi";

const props = defineProps({ id: [String, Number] });
const router = useRouter();
const form = reactive({ title: "", content: "", writer: "" });
const selectedFiles = ref([]);
const loading = ref(true);
const saving = ref(false);

/* =========================================================
   기존 첨부파일
========================================================= */
const existingFiles = ref([]);
const deleteFileIds = ref([]);
const blobUrlMap = ref({});

const imageExtensions = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];

function isImage(file) {
  if (!file.originalName) return false;
  const ext = file.originalName.split(".").pop().toLowerCase();
  return imageExtensions.includes(ext);
}

const existingImageFiles = computed(() => existingFiles.value.filter(isImage));

const existingOtherFiles = computed(() =>
  existingFiles.value.filter((file) => !isImage(file)),
);

function toggleDelete(fileId) {
  const idx = deleteFileIds.value.indexOf(fileId);
  if (idx === -1) {
    deleteFileIds.value.push(fileId);
  } else {
    deleteFileIds.value.splice(idx, 1);
  }
}

async function loadImageBlobs() {
  Object.values(blobUrlMap.value).forEach((url) => {
    if (url) window.URL.revokeObjectURL(url);
  });
  blobUrlMap.value = {};

  for (const file of existingImageFiles.value) {
    try {
      const response = await api.get(`/boards/download/${file.fileId}`, {
        responseType: "blob",
      });
      blobUrlMap.value[file.fileId] = window.URL.createObjectURL(response.data);
    } catch (e) {
      console.error("[BoardEdit] 이미지 불러오기 실패:", file.originalName, e);
    }
  }
}

function getFileIcon(fileName) {
  if (!fileName) return "📁";
  const ext = fileName.split(".").pop().toLowerCase();

  if (imageExtensions.includes(ext)) return "🖼️";
  if (ext === "pdf") return "📕";
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return "📦";
  if (["doc", "docx", "hwp"].includes(ext)) return "📝";
  if (["xls", "xlsx"].includes(ext)) return "📊";
  if (["ppt", "pptx"].includes(ext)) return "📊";
  return "📎";
}

function formatSize(size) {
  if (!size) return "0 B";
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
   새 파일 선택
========================================================= */
function onFiles(e) {
  selectedFiles.value = Array.from(e.target.files).slice(0, 5);
}

/* =========================================================
   게시글 불러오기
========================================================= */
async function load() {
  try {
    const { data } = await getBoard(props.id);
    form.title = data.title ?? "";
    form.content = data.content ?? "";
    form.writer = data.writer ?? "";

    existingFiles.value = data.fileList ?? data.files ?? data.boardFiles ?? [];

    await loadImageBlobs();
  } catch (e) {
    console.error("게시글 불러오기 실패:", e);
    alert("게시글을 불러오지 못했습니다.");
    router.push("/boards");
  } finally {
    loading.value = false;
  }
}

/* =========================================================
   수정 제출
========================================================= */
async function submit() {
  if (selectedFiles.value.length > 5) {
    alert("첨부파일은 최대 5개까지 등록 가능합니다.");
    return;
  }

  saving.value = true;
  try {
    const formData = new FormData();

    const boardDto = {
      title: form.title,
      content: form.content,
      writer: form.writer,
    };

    formData.append(
      "board",
      new Blob([JSON.stringify(boardDto)], { type: "application/json" }),
    );

    selectedFiles.value.forEach((file) => {
      formData.append("files", file);
    });

    // 삭제할 기존 파일 ID들 (RequestParam List<Long> deleteFileIds로 매핑됨)
    deleteFileIds.value.forEach((id) => {
      formData.append("deleteFileIds", id);
    });

    await updateBoard(props.id, formData);

    alert("게시글이 수정되었습니다.");
    router.push(`/boards/${props.id}`);
  } catch (e) {
    console.error("게시글 수정 실패 상세:", e.response || e);

    const errorMsg =
      typeof e.response?.data === "string"
        ? e.response.data
        : e.response?.data?.message || "수정에 실패했습니다.";

    alert(errorMsg);
  } finally {
    saving.value = false;
  }
}

onUnmounted(() => {
  Object.values(blobUrlMap.value).forEach((url) => {
    if (url) window.URL.revokeObjectURL(url);
  });
});

onMounted(load);
</script>

<style scoped>
.input-locked {
  background-color: #f2f2f2;
  color: #666;
  cursor: not-allowed;
}
.selected-files {
  margin-top: 8px;
  font-size: 0.9em;
  color: #555;
}

/* =========================================================
   기존 이미지
========================================================= */
.image-gallery {
  margin: 20px 0;
}

.image-gallery h3 {
  font-size: 1em;
  margin-bottom: 10px;
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
  width: 220px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fafafa;
  transition: opacity 0.2s;
}

.image-item.marked-delete {
  opacity: 0.4;
}

.image-item img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
}

.image-loading {
  width: 100%;
  height: 160px;
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
   기존 첨부파일
========================================================= */
.files {
  margin: 20px 0;
  padding: 12px 16px;
  background-color: #f8fafc;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.files h3 {
  font-size: 0.95em;
  margin-bottom: 10px;
  color: #475569;
}

.file-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 0.9em;
}

.file-item.marked-delete {
  opacity: 0.4;
}

.file-size {
  color: #64748b;
}

/* =========================================================
   삭제 체크박스
========================================================= */
.delete-check {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8em;
  color: #dc2626;
  padding: 4px 8px;
  cursor: pointer;
}
</style>
