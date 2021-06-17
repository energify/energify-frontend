<script lang="ts">
  import { format } from "date-fns";
  import { onMount } from "svelte";
  import Icon from "svelte-hero-icons";
  import Badge from "../../common/components/badge/Badge.svelte";
  import Spinner from "../../common/components/spinner/Spinner.svelte";
  import Table from "../../common/components/table/Table.svelte";
  import TableNotFound from "../../common/components/table/TableNotFound.svelte";
  import TablePagination from "../../common/components/table/TablePagination.svelte";
  import type { Payment } from "../../common/interfaces/payments.interfaces";
  import { apiService } from "../../common/services/api.service";
  import { paymentsService } from "../../common/services/payments.service";
  import { usersService } from "../../common/services/users.service";
  import WalletPaymentsFilter from "./WalletPaymentsFilter.svelte";

  const payments = paymentsService.getPayments();
  const user = usersService.getUser();
  let payingBtnSpin: boolean[] = [];
  let filters = {
    type: "all",
    minPrice: 0,
    maxPrice: 5,
    date: undefined,
  };

  function handleFilterChange(type: string, minPrice: number, maxPrice: number, date?: Date) {
    filters = { type, minPrice, maxPrice, date };
    paymentsService.fetchPayments(
      1,
      filters.type,
      filters.minPrice,
      filters.maxPrice,
      filters.date
    );
  }

  async function handlePay(payment: Payment, index: number) {
    payingBtnSpin[index] = true;
    await paymentsService.pay(payment);
    payingBtnSpin[index] = false;
  }

  onMount(() => {
    paymentsService.fetchPayments();
  });
</script>

<div class="flex items-center justify-between mb-6">
  <h3 class="text-gray-900 text-xl font-semibold">Latest Payments</h3>
  <WalletPaymentsFilter onFiltered={handleFilterChange} />
</div>

<Table headers={["Amount", "Price", "Date", "Explore", ""]}>
  {#if $payments.data?.length === 0}
    <TableNotFound headersNum={5} />
  {:else}
    {#each $payments.data as payment, i}
      <tr>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">{payment.amount.toFixed(4)} kW</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            {#if payment.consumerId === $user._id}
              <Badge color="red">${payment.amount.toFixed(3)}</Badge>
            {:else}
              <Badge color="green">${payment.amount.toFixed(3)}</Badge>
            {/if}
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm text-gray-900">
            {format(new Date(payment.issuedAt), "dd/MM HH:mm")}
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          {#if payment.paidAt}
            <a
              class="underline text-green-800"
              href="https://explorer.kabuto.sh/testnet/transaction/{payment.hederaTransactionHash}"
              target="_blank">Explore</a
            >
          {:else}
            --
          {/if}
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          {#if payment.paidAt}
            <a
              href={`${apiService.baseUrl}/payments/${payment._id}/invoice`}
              target="_blank"
              class="btn-secundary"
            >
              Invoice
            </a>
          {:else if payment.consumerId === $user._id}
            <button on:click={() => handlePay(payment, i)} class="flex btn-secundary">
              {#if payingBtnSpin[i]}
                <Spinner />
              {/if}
              Pay
            </button>
          {/if}
        </td>
      </tr>
    {/each}
  {/if}
</Table>
<TablePagination
  onPageChange={(page) =>
    paymentsService.fetchPayments(
      page,
      filters.type,
      filters.minPrice,
      filters.maxPrice,
      filters.date
    )}
  itemsLength={$payments.count}
/>
