<script>
  import Card from "../../common/components/card/Card.svelte";
  import Icon, { Download } from "svelte-hero-icons";
</script>

<Card title="Informations">
  <dl class="border-b border-gray-200">
    <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 ">
      <dt class="text-sm font-medium text-gray-500">Account Id</dt>
      <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">0.0.14240</dd>
    </div>
  </dl>
  <dl class="mb-8">
    <div class="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 ">
      <dt class="text-sm font-medium text-gray-500">Public Key</dt>
      <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">1291hfubasfuabsu</dd>
    </div>
  </dl>
  <button class="btn-secundary flex items-center">
    <Icon src={Download} class="w-6 h-6 mr-1" />
    Private Key
  </button>
</Card>
