import { reactive, computed } from "vue";

function decodeUsername(token) {
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(
      decodeURIComponent(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join(""),
      ),
    );
    return json.sub || null;
  } catch {
    return null;
  }
}

// 1. 싱글톤 반응형 상태
const state = reactive({
  accessToken: localStorage.getItem("accessToken") || null,
});

function setToken(accessToken, refreshToken) {
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    state.accessToken = accessToken;
  }
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
}

function clearToken() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  state.accessToken = null;
}

// 2. 외부에서 최신 토큰을 동기화하는 함수
function refreshAuthState() {
  state.accessToken = localStorage.getItem("accessToken") || null;
}

export function useAuth() {
  return {
    isLoggedIn: computed(() => !!state.accessToken),
    username: computed(() => decodeUsername(state.accessToken)),
    accessToken: computed(() => state.accessToken),
    setToken,
    clearToken,
    refreshAuthState,
  };
}
