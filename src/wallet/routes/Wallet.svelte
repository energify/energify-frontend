<script>
  import Shell from "../../common/components/shell/Shell.svelte";
  import WalletBalance from "../components/WalletBalance.svelte";
  import WalletInformation from "../components/WalletInformation.svelte";
  import WalletTransactions from "../components/WalletTransactions.svelte";
</script>

<Shell title="Wallet">
  <div class="grid grid-cols-12 gap-8">
    <div class="flex flex-col col-span-12 lg:col-span-4">
      <div class="mb-8">
        <WalletBalance />
      </div>
      <WalletInformation />
    </div>
    <div class="col-span-12 lg:col-span-8">
      <WalletTransactions />
    </div>
  </div>
</Shell>
