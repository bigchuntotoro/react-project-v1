import { createRouter, createWebHistory } from "vue-router";
import BoardList from "../views/BoardList.vue";
import BoardDetail from "../views/BoardDetail.vue";
import BoardWrite from "../views/BoardWrite.vue";
import BoardEdit from "../views/BoardEdit.vue";
import OAuthRedirect from "../views/OAuthRedirect.vue";
import Login from "../views/Login.vue";

const routes = [
  { path: "/", redirect: "/boards" },
  { path: "/boards", name: "BoardList", component: BoardList },
  { path: "/boards/write", name: "BoardWrite", component: BoardWrite },
  {
    path: "/boards/:id",
    name: "BoardDetail",
    component: BoardDetail,
    props: true,
  },
  {
    path: "/boards/:id/edit",
    name: "BoardEdit",
    component: BoardEdit,
    props: true,
  },
  {
    path: "/oauth/redirect",
    name: "OAuthRedirect",
    component: OAuthRedirect,
  },
  {
    path: "/signin", // ✅ /login 대신 /signin 사용 (백엔드 프록시와 충돌 방지)
    name: "Login",
    component: Login,
  },
];

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  },
});
