<template>
  <section class="login-page">
    <h1>로그인</h1>
    <p>게시글 작성/수정/삭제 등은 로그인 후 이용하실 수 있습니다.</p>
    <div class="oauth-buttons">
      <a class="oauth-btn naver" href="#" @click.prevent="handleNaverLogin">
        <span class="naver-icon">N</span>
        네이버로 로그인
      </a>
    </div>
    <router-link to="/boards" class="back-link">목록으로 돌아가기</router-link>
  </section>
</template>

<script setup>
function handleNaverLogin() {
  // 1. 현재 프론트엔드 origin을 쿠키에 저장 (로그인 성공 후 올바른 포트로 돌아오기 위함)
  document.cookie = `oauth2_frontend=${window.location.origin}; Path=/; SameSite=Lax`;

  // 2. 현재 접속 중인 호스트(localhost 또는 100.88.187.37)를 기준으로 백엔드(8083포트) 주소 동적 생성
  const backendHost = window.location.hostname;
  window.location.href = `http://${backendHost}:8083/oauth2/authorization/naver`;
}
</script>

<style scoped>
.login-page {
  max-width: 420px;
  margin: 80px auto;
  text-align: center;
}
.oauth-buttons {
  margin: 30px 0;
}
.oauth-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: bold;
  font-size: 1em;
  cursor: pointer;
}
.oauth-btn.naver {
  background: #03c75a;
  color: #fff;
}
.naver-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: #fff;
  color: #03c75a;
  border-radius: 3px;
  font-weight: 900;
  font-size: 0.85em;
}
.back-link {
  display: inline-block;
  margin-top: 16px;
  color: #666;
  text-decoration: underline;
}
</style>
