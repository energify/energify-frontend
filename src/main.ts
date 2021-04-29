import App from "./App.svelte";
import { AuthService } from "./auth/auth.service";

export const authService = new AuthService();
const app = new App({ target: document.body });

export default app;
