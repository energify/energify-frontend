<script lang="ts">
  import { onMount } from "svelte";
  import Icon, { Exclamation } from "svelte-hero-icons";
  import { push } from "svelte-spa-router";
  import { authService, hederaService } from "../../common/services/services.injector";

  let mnemonic = "";
  let completeFormData = {
    nif: "",
    address: "",
  };

  async function generateMnemonicAndKeyPairs() {
    mnemonic = await hederaService.generateMnemonic();
  }

  async function handleComplete() {
    try {
      const { privateKey, publicKey } = await hederaService.generateKeyPairs(mnemonic);
      const hederaAccountId = await hederaService.createAccount(privateKey, publicKey);
      await authService.complete({ ...completeFormData, hederaAccountId });
      push("/");
    } catch {}
  }

  onMount(() => {
    generateMnemonicAndKeyPairs();
  });
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <img class="mx-auto h-12 w-auto" src="https://energify.pt/logo-small.png" alt="Workflow" />
    <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Complete Account</h2>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <form class="space-y-6" on:submit|preventDefault={handleComplete}>
        <div>
          <div
            class="flex items-center bg-yellow-100 text-yellow-800 p-2 rounded-md 
            text-sm mt-2"
          >
            <Icon src={Exclamation} class="mr-2 w-8 h-8" />
            The recovery phrase is only showed once, store it in a safe place.
          </div>
        </div>

        <div>
          <label for="nif" class="block text-sm font-medium text-gray-700"> Nif </label>
          <div class="mt-1">
            <input id="nif" name="nif" required class="input" bind:value={completeFormData.nif} />
          </div>
        </div>

        <div>
          <label for="address" class="block text-sm font-medium text-gray-700"> Address </label>
          <div class="mt-1">
            <input
              id="address"
              name="address"
              required
              class="input"
              bind:value={completeFormData.address}
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

        <div>
          <button type="submit" class="w-full flex justify-center btn"> Complete </button>
        </div>
      </form>
    </div>
  </div>
</div>
