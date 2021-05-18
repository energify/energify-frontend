<script lang="ts">
  import { push } from "svelte-spa-router";

  import { authService } from "../../common/services/services.injector";

  let registerFormData = {
    name: "",
    birthday: "",
    email: "",
    password: "",
    cc: "",
  };

  async function handleRegister() {
    try {
      await authService.register(registerFormData);
      push("/auth/login");
    } catch {}
  }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <img class="mx-auto h-12 w-auto" src="https://energify.pt/logo-small.png" alt="Workflow" />
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Create a new account</h2>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <form class="space-y-6" on:submit|preventDefault={handleRegister}>
        <div>
          <label for="name" class="block text-sm font-medium text-gray-700"> Name </label>
          <div class="mt-1">
            <input
              id="name"
              name="name"
              required
              class="input"
              bind:value={registerFormData.name}
            />
          </div>
        </div>

        <div>
          <label for="birthday" class="block text-sm font-medium text-gray-700"> Birthday </label>
          <div class="mt-1">
            <input
              id="birthday"
              type="date"
              name="birthday"
              required
              class="input"
              bind:value={registerFormData.birthday}
            />
          </div>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700"> Email address </label>
          <div class="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              required
              class="input"
              bind:value={registerFormData.email}
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
              bind:value={registerFormData.password}
            />
          </div>
        </div>

        <div>
          <label for="cc" class="block text-sm font-medium text-gray-700"> Citizen No </label>
          <div class="mt-1">
            <input id="cc" name="cc" required class="input" bind:value={registerFormData.cc} />
          </div>
        </div>

        <div>
          <button type="submit" class="w-full flex justify-center btn"> Sign up </button>
        </div>
      </form>
    </div>
  </div>
</div>
