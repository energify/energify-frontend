import wrap from "svelte-spa-router/wrap";
import Dashboard from "./routes/Dashboard.svelte";

export default {
  "/": wrap({
    component: Dashboard,
    conditions: [],
  }),
};
