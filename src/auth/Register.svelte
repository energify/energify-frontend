<script lang="ts">
  import { onMount } from "svelte";
  import Icon, { Exclamation } from "svelte-hero-icons";

  import { push } from "svelte-spa-router";
  import Badge from "../common/components/badge/Badge.svelte";
  import { authService } from "../common/services/auth.service";
  import { hederaService } from "../common/services/hedera.service";
  import { notificationService } from "../common/services/notifications.service";

  let registerFormData = {
    name: "",
    email: "",
    password: "",
    hederaAccountId: "",
  };

  let mnemonic = "";

  onMount(async () => {
    mnemonic = await hederaService.generateMnemonic();
  });

  async function handleRegister() {
    const hederaAccountId = await hederaService.createAccount(mnemonic);
    const { error, message } = await authService.register({ ...registerFormData, hederaAccountId });
    if (error) {
      notificationService.push({ title: "Error", description: message, type: "error" });
    } else {
      push("/auth/login");
    }
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
          <div
            class="flex justify-center items-center mr-2 bg-yellow-100 text-yellow-700 rounded-md p-1"
          >
            <Icon src={Exclamation} class="w-12 h-12 mr-2" />
            <span class="text-sm">
              Recovery phrase is the only way to recover your hedera wallet so store it safely.
            </span>
          </div>
        </div>
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
          <span class="block text-sm font-medium text-gray-700">Recovery Phrase</span>
          <div class="grid grid-cols-12 mt-2 gap-3">
            {#each mnemonic.split(" ") as word}
              <div
                class="flex items-center justify-center bg-gray-100 text-gray-600 px-1 mr-4 
                rounded-md col-span-3"
              >
                {word}
              </div>
            {/each}
          </div>
        </div>

        <div class="mt-2">
          <button type="submit" class="w-full flex justify-center btn"> Sign up </button>
        </div>
      </form>
    </div>
  </div>
</div>
