import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import { t } from "./stores/i18n";
import { useAuthStore } from "./stores/auth";

const app = createApp(App);

app.config.globalProperties.$t = t;

const pinia = createPinia();
app.use(pinia);
app.use(router);
app.mount("#app");

// Revalidate the stored Sanctum token against GET /api/user. This runs after
// mount on purpose: the router guards already work off the synchronously
// restored localStorage session, and if the token turns out to be expired the
// Axios 401 handler clears it and redirects. Keeping it off the critical path
// means a slow or unreachable API can never block the first paint.
useAuthStore(pinia)
  .initializeAuth()
  .catch(() => {
    /* the store already falls back to a signed-out session */
  });
