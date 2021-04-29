import { wrap } from "svelte-spa-router/wrap";
import { authService } from "../main";
import Login from "./routes/Login.svelte";
import Register from "./routes/Register.svelte";

export default {
  "/auth/login": wrap({
    component: Login,
    conditions: [async () => !(await authService.isLoggedIn())],
  }),
  "/auth/register": wrap({
    component: Register,
    conditions: [async () => !(await authService.isLoggedIn())],
  }),
};
