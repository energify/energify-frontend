<script>
  import Card from "../../common/components/card/Card.svelte";
  import Icon, { ArrowUp } from "svelte-hero-icons";
</script>

<Card>
  <div class="flex justify-between items-center">
    <div class="flex flex-col">
      <span class="text-2xl font-semibold">
        $1.18 <span class="text-sm text-gray-500 font-normal"> / kWh</span>
      </span>
      <span class="text-md text-gray-500">Last 24 hours</span>
    </div>
    <div>
      <span class="flex bg-green-100 text-green-800 px-2 rounded-full font-semibold items-center">
        <Icon src={ArrowUp} class="w-4 h-4 text-green-500 mr-2" solid />
        3.53%
      </span>
    </div>
  </div>
</Card>
