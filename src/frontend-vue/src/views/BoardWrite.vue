<template>
  <section>
    <h1>게시글 작성</h1>

    <form class="form" @submit.prevent="submit">
      <!-- 제목 -->
      <label>제목</label>
      <input
        v-model="form.title"
        maxlength="200"
        required
        placeholder="제목을 입력하세요."
      />

      <!-- 작성자 -->
      <label>작성자</label>
      <input
        :value="username || ''"
        maxlength="50"
        readonly
        class="input-locked"
      />

      <!-- 내용 -->
      <label>내용</label>
      <textarea
        v-model="form.content"
        rows="14"
        required
        placeholder="내용을 입력하세요."
      ></textarea>

      <!-- 첨부파일 -->
      <label>첨부파일 (최대 5개)</label>

      <input type="file" multiple @change="onFiles" />

      <div v-if="selectedFiles.length > 0" class="selected-files">
        <div
          v-for="(file, index) in selectedFiles"
          :key="`${file.name}-${index}`"
        >
          {{ file.name }}
        </div>
      </div>

      <!-- 버튼 -->
      <div class="actions">
        <router-link to="/boards" class="btn"> 취소 </router-link>

        <button
          type="submit"
          class="btn primary"
          :disabled="saving || !isLoggedIn"
        >
          {{ saving ? "등록 중..." : "등록" }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref, onMounted } from "vue";
import { useRouter } from "vue-router";

import { createBoard } from "../api/boardApi";
import { useAuth } from "../api/useAuth";

const router = useRouter();

const { isLoggedIn, username } = useAuth();

const form = reactive({
  title: "",
  content: "",
});

const selectedFiles = ref([]);
const saving = ref(false);

/**
 * 페이지 진입 시 로그인 여부 확인
 */
onMounted(() => {
  if (!isLoggedIn.value) {
    alert("로그인이 필요한 서비스입니다.");
    router.push("/signin");
  }
});

/**
 * 첨부파일 선택
 */
function onFiles(event) {
  const files = Array.from(event.target.files || []);

  if (files.length > 5) {
    alert("첨부파일은 최대 5개까지 등록할 수 있습니다.");
  }

  selectedFiles.value = files.slice(0, 5);

  // input에 5개를 초과해서 선택한 경우
  if (files.length > 5) {
    event.target.value = "";
  }
}

/**
 * 게시글 등록
 */
async function submit() {
  // 로그인 확인
  if (!isLoggedIn.value) {
    alert("로그인이 필요한 서비스입니다.");
    router.push("/login");
    return;
  }

  // 제목 확인
  if (!form.title.trim()) {
    alert("제목을 입력하세요.");
    return;
  }

  // 내용 확인
  if (!form.content.trim()) {
    alert("내용을 입력하세요.");
    return;
  }

  // 중복 등록 방지
  if (saving.value) {
    return;
  }

  saving.value = true;

  try {
    const formData = new FormData();

    /*
     * 중요:
     *
     * writer는 프론트에서 보내지 않습니다.
     *
     * Spring Security의 Authentication에서
     * JWT 로그인 사용자를 가져와 서버에서 설정합니다.
     *
     * 따라서 다음과 같이 title/content만 전송합니다.
     */
    const boardDto = {
      title: form.title.trim(),
      content: form.content.trim(),
    };

    /*
     * @RequestPart("board") BoardDto boardDto
     */
    const boardBlob = new Blob([JSON.stringify(boardDto)], {
      type: "application/json",
    });

    formData.append("board", boardBlob);

    /*
     * @RequestPart(value = "files", required = false)
     */
    selectedFiles.value.forEach((file) => {
      formData.append("files", file);
    });

    /*
     * createBoard()
     *
     * boardApi.js에서 Authorization 헤더에
     *
     * Bearer {accessToken}
     *
     * 이 자동으로 추가됩니다.
     */
    const response = await createBoard(formData);

    console.log("게시글 등록 성공:", response);

    const data = response.data;

    /*
     * 현재 Controller는
     *
     * return ResponseEntity.ok("등록 완료");
     *
     * 이므로 문자열 응답입니다.
     */
    if (typeof data === "string") {
      alert(data);
    } else {
      alert("게시글이 성공적으로 등록되었습니다.");
    }

    // 게시글 목록으로 이동
    router.push("/boards");
  } catch (error) {
    console.error("게시글 등록 실패:", error);

    /*
     * HTTP 상태 코드 확인
     */
    const status = error.response?.status;

    console.error("HTTP 상태:", status);
    console.error("응답 데이터:", error.response?.data);

    /*
     * 401인 경우에만 로그인 만료로 처리
     *
     * 실제 400 JSON parse 오류를
     * 로그아웃으로 처리하지 않도록 합니다.
     */
    if (status === 401) {
      alert("로그인이 만료되었습니다. 다시 로그인해주세요.");

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      router.push("/signin");
      return;
    }

    /*
     * Spring Boot 에러 메시지 처리
     */
    let errorMessage = "게시글 등록에 실패했습니다.";

    if (typeof error.response?.data === "string") {
      errorMessage = error.response.data;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    alert(errorMessage);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.form input,
.form textarea {
  padding: 10px;
  font-size: 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form textarea {
  resize: vertical;
}

.input-locked {
  background-color: #f2f2f2;
  color: #666;
  cursor: not-allowed;
}

.selected-files {
  margin-top: 5px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #fafafa;
}

.selected-files div {
  margin-bottom: 4px;
}

.selected-files div:last-child {
  margin-bottom: 0;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn {
  display: inline-block;
  padding: 10px 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-decoration: none;
  background: white;
  color: #333;
  cursor: pointer;
}

.btn.primary {
  background: #333;
  color: white;
  border-color: #333;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
