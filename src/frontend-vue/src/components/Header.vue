<template>
  <header class="header">
    <div class="header-inner">
      <router-link to="/boards" class="logo">MY BOARD</router-link>

      <nav>
        <router-link to="/boards">게시판</router-link>
        <router-link to="/boards/write">글쓰기</router-link>

        <button class="nav-login" @click="naverLogin">
          {{ isLoggedIn ? "로그인됨" : "Naver 로그인" }}
        </button>

        <button v-if="isLoggedIn" class="nav-logout" @click="logout">
          로그아웃
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useAuth } from "../api/useAuth";

const { isLoggedIn, clearToken } = useAuth();

function naverLogin() {
  // Vue에서 로그인한다는 표시 (리다이렉트 전에 먼저 세팅)
  document.cookie = "oauth2_frontend=vue; Path=/; SameSite=Lax";
  window.location.href = "/oauth2/authorization/naver";
}

function logout() {
  clearToken();
  window.location.href = "/boards";
}
</script>
