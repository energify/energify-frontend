<script lang="ts">
  import { onMount } from "svelte";

  import { push } from "svelte-spa-router";
  import { authService } from "../common/services/auth.service";
  import { notificationService } from "../common/services/notifications.service";
  import { usersService } from "../common/services/users.service";

  const user = usersService.getUser();
  let loginFormData = { email: "", password: "" };

  async function handleLogin() {
    const { error, message } = await authService.login(loginFormData);
    if (error) {
      notificationService.push({ title: "Error", description: message, type: "error" });
    } else {
      push("/");
    }
  }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <img class="mx-auto h-12 w-auto" src="https://energify.pt/logo-small.png" alt="Workflow" />
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <div class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700"> Email address </label>
          <div class="mt-1">
            <input
              id="email"
              name="email"
              autocomplete="off"
              type="email"
              required
              class="input"
              bind:value={loginFormData.email}
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
          <div class="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              required
              class="input"
              bind:value={loginFormData.password}
            />
          </div>
        </div>

        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember_me"
              name="remember_me"
              type="checkbox"
              class="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label for="remember_me" class="ml-2 block text-sm text-gray-900"> Remember me </label>
          </div>

          <div class="text-sm">
            <a href="#/auth/register" class="font-medium text-green-600 hover:text-green-500">
              Create a new account?
            </a>
          </div>
        </div>

        <div>
          <button on:click={handleLogin} type="submit" class="w-full flex justify-center btn">
            Sign in
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
