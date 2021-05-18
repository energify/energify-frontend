import wrap from "svelte-spa-router/wrap";
import { authService } from "../common/services/services.injector";
import Trading from "./routes/Trading.svelte";

export default {
  "/trading": wrap({
    component: Trading,
    conditions: [async () => await authService.isLoggedIn()],
  }),
};
