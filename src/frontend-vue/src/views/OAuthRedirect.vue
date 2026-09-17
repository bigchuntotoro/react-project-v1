<template>
  <div class="oauth-redirect">
    <p v-if="!errorMessage">로그인 처리 중...</p>
    <p v-else class="error">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuth } from "../api/useAuth";

const route = useRoute();
const router = useRouter();
const { setToken } = useAuth();
const errorMessage = ref("");

onMounted(() => {
  const token = route.query.token;
  const refreshToken = route.query.refreshToken;

  if (token) {
    setToken(token, refreshToken);
    router.replace("/");
  } else {
    errorMessage.value = "로그인에 실패했습니다. 다시 시도해주세요.";
    setTimeout(() => {
      router.replace("/signin?error=oauth"); // ✅ /login → /signin
    }, 1500);
  }
});
</script>

<style scoped>
.oauth-redirect {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 1.1rem;
  color: #555;
}

.oauth-redirect .error {
  color: #e53935;
}
</style>
