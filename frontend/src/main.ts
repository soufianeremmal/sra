import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { useAuthStore } from './stores/auth';
import './styles/tokens.css';

const app = createApp(App);
app.use(createPinia());

// Restore the session before mounting — if we have a token, fetch the user.
// This makes page refresh preserve the logged-in state.
const auth = useAuthStore();
await auth.fetchCurrentUser();

app.use(router);
app.mount('#app');