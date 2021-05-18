import wrap from "svelte-spa-router/wrap";
import { authService } from "../common/services/services.injector";
import Dashboard from "./routes/Dashboard.svelte";

export default {
  "/": wrap({
    component: Dashboard,
    conditions: [async () => await authService.isLoggedIn()],
  }),
};
