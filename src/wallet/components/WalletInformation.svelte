<script lang="ts">
  import Icon, { Exclamation } from "svelte-hero-icons";
  import Card from "../../common/components/card/Card.svelte";
  import { hederaService } from "../../common/services/hedera.service";
  import { notificationService } from "../../common/services/notifications.service";
  import { usersService } from "../../common/services/users.service";

  const hederaPrivateKey = hederaService.getPrivateKey();
  const user = usersService.getUser();
  let privateKey: string = "";

  function handleImportPrivateKey() {
    try {
      hederaService.importPrivateKey(privateKey);
      notificationService.push({
        title: "Success",
        description: "Private key imported with success",
        type: "success",
      });
      hederaService.fetchBalance();
    } catch (e) {
      notificationService.push({ title: "Error", description: e.message, type: "error" });
    }
  }
</script>

<Card title="Informations">
  <dl class="border-b border-gray-200">
    <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 ">
      <dt class="text-sm font-medium text-gray-500">Account Id</dt>
      <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
        {$user.hederaAccountId}
      </dd>
    </div>
  </dl>
  {#if $hederaPrivateKey}
    <dl class="mb-4">
      <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 ">
        <dt class="text-sm font-medium text-gray-500">Explore</dt>
        <a
          target="_blank"
          href="https://explorer.kabuto.sh/testnet/id/{$user.hederaAccountId}"
          class="underline text-green-800 mt-1 text-sm sm:mt-0 sm:col-span-2"
        >
          Explore
        </a>
      </div>
    </dl>
    <button
      on:click={() => hederaService.exportPrivateKey()}
      class="btn-secundary flex items-center"
    >
      Export
    </button>
  {:else}
    <div>
      <div
        class="flex items-center bg-yellow-100 text-yellow-800 p-2 rounded-md 
      text-sm my-8"
      >
        <Icon src={Exclamation} class="mr-2 w-8 h-8" />
        This device doesn't contain your wallet private key. Please import it.
      </div>
    </div>
    <div class="flex items-center">
      <input class="input mr-3" placeholder="Private key" bind:value={privateKey} />
      <button on:click={handleImportPrivateKey} class="btn-secundary flex items-center">
        Import
      </button>
    </div>
  {/if}
</Card>
