import wrap from "svelte-spa-router/wrap";
import { get } from "svelte/store";
import { usersService } from "./common/services/users.service";
import Dashboard from "./dashboard/Dashboard.svelte";
import Trading from "./trading/Trading.svelte";
import Wallet from "./wallet/Wallet.svelte";
import Login from "./auth/Login.svelte";
import Register from "./auth/Register.svelte";
import { ConditionsFailedEvent, replace } from "svelte-spa-router";

async function loggedInCondition() {
  if (get(usersService.getUser())._id) {
    return true;
  }
  await usersService.fetchAuthedUser();
  if (get(usersService.getUser())._id) {
    return true;
  }
  return false;
}

async function notLoggedInCondition() {
  return !(await loggedInCondition());
}

export function conditionsFailed(event: ConditionsFailedEvent) {
  if (event.detail.route.toString().includes("auth")) {
    replace("/");
  } else {
    replace("/auth/login");
  }
}

export default {
  "/": wrap({
    component: Dashboard,
    conditions: [loggedInCondition],
  }),
  "/trading": wrap({
    component: Trading,
    conditions: [loggedInCondition],
  }),
  "/wallet": wrap({
    component: Wallet,
    conditions: [loggedInCondition],
  }),
  "/auth/login": wrap({
    component: Login,
    conditions: [notLoggedInCondition],
  }),
  "/auth/register": wrap({
    component: Register,
    conditions: [notLoggedInCondition],
  }),
};
