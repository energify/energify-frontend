<script lang="ts">
  import { formatDistanceToNow } from "date-fns";
  import Badge from "../../common/components/badge/Badge.svelte";
  import Table from "../../common/components/table/Table.svelte";
  import TableNotFound from "../../common/components/table/TableNotFound.svelte";
  import TableSkeleton from "../../common/components/table/TableSkeleton.svelte";
  import { authService, paymentsService } from "../../common/services/services.injector";
  import WalletPaymentsFilter from "./WalletPaymentsFilter.svelte";

  const { user } = authService;
  let paymentsPromise = paymentsService.fetchPayments();
  const userId = 10;

  async function fetchPayments(type: string, minPrice: number, maxPrice: number, date: Date) {
    paymentsPromise = paymentsService.fetchPayments(type, minPrice, maxPrice, date);
  }
</script>

<div class="flex items-center justify-between mb-6">
  <h3 class="text-gray-900 text-xl font-semibold">Latest Payments</h3>
  <WalletPaymentsFilter onFiltered={fetchPayments} />
</div>

<Table headers={["Amount", "Price", "Date", "Explore", "Invoice"]}>
  {#await paymentsPromise}
    <TableSkeleton headersNum={5} rowsNum={5} />
  {:then { data }}
    {#if data.length === 0}
      <TableNotFound headersNum={5} />
    {/if}
    {#each data as payment}
      <tr>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">50 kW</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            {#if payment.consumerId === userId}
              <Badge color="red">${payment.amount.toFixed(2)}</Badge>
            {:else}
              <Badge color="green">${payment.amount.toFixed(2)}</Badge>
            {/if}
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">
            {formatDistanceToNow(new Date(payment.createdAt))} ago
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <a
            class="underline text-green-800"
            href="https://explorer.kabuto.sh/testnet/transaction/{payment.hederaTransactionId}"
            target="_blank">Explore</a
          >
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <button class="btn-secundary"> Invoice </button>
        </td>
      </tr>
    {/each}
  {/await}
</Table>
