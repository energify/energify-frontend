import { wrap } from "svelte-spa-router/wrap";
import { authService } from "../common/services/services.injector";
import Wallet from "./routes/Wallet.svelte";

export default {
  "/wallet": wrap({
    component: Wallet,
    //conditions: [async () => await authService.isLoggedIn()],
  }),
};
