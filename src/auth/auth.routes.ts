import { wrap } from "svelte-spa-router/wrap";
import Login from "./routes/Login.svelte";
import Register from "./routes/Register.svelte";
import Complete from "./routes/Complete.svelte";
import { authService } from "../common/services/services.injector";

export default {
  "/auth/login": wrap({
    component: Login,
    //conditions: [async () => !(await authService.isLoggedIn())],
  }),
  "/auth/register": wrap({
    component: Register,
    //conditions: [async () => !(await authService.isLoggedIn())],
  }),
  "/auth/complete": wrap({
    component: Complete,
    /*conditions: [
      async () => await authService.isLoggedIn(),
      () => !authService.isAccountComplete(),
    ],*/
  }),
};
