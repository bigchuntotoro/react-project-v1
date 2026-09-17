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
// Spring Security OAuth2 Client 사용 시
// 기본 로그인 시작 엔드포인트는 /oauth2/authorization/{registrationId} 입니다.
// application.yml의 spring.security.oauth2.client.registration.naver 설정과
// registrationId("naver")가 일치해야 합니다.

// 🟢 네이버 로그인 처리: 이동 전에 현재 origin을 쿠키로 저장
// → OAuth2SuccessHandler가 로그인 완료 후 이 값(화이트리스트 검증)으로 되돌려보냄
function handleNaverLogin() {
  document.cookie = `oauth2_frontend=${window.location.origin}; Path=/; SameSite=Lax`;
  window.location.href = "/oauth2/authorization/naver";
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
