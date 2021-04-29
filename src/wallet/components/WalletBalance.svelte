<script lang="ts">
  import Card from "../../common/components/card/Card.svelte";
  import Icon, { Plus } from "svelte-hero-icons";
</script>

<Card>
  <div class="flex justify-between items-center">
    <div class="flex flex-col">
      <span class="text-3xl text-gray-800 font-semibold">150.00 ℏ</span>
      <span class="text-lg text-gray-400 font-medium">≈ $15.0</span>
    </div>
    <div>
      <button class="btn flex items-center">
        <Icon src={Plus} class="w-6 h-6 mr-1" />
        Funds
      </button>
    </div>
  </div>
</Card>
