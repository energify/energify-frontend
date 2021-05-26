<script lang="ts">
  import { LightningBolt, Cash, Cloud } from "svelte-hero-icons";
  import Shell from "../../common/components/shell/Shell.svelte";
  import Stat from "../../common/components/stat/Stat.svelte";
  import EnergyHistoryChart from "../components/EnergyHistoryChart.svelte";
  import EnergyFlowChart from "../components/EnergyFlowChart.svelte";
</script>

<Shell title="Dashboard">
  <div class="grid grid-cols-12 gap-12">
    <div class="col-span-12 xl:col-span-6">
      <EnergyHistoryChart />
    </div>
    <div class="col-span-12 xl:col-span-6 grid grid-cols-12 gap-6">
      <div class="col-span-12 md:col-span-4">
        <Stat icon={LightningBolt} text="Used energy" value="10 kWh" />
      </div>
      <div class="col-span-12 md:col-span-4">
        <Stat icon={Cloud} text="Emitted Co2" value="78 kg" />
      </div>
      <div class="col-span-12 md:col-span-4">
        <Stat icon={Cash} text="Saved" value="$24.34" />
      </div>
      <div class="col-span-12">
        <EnergyFlowChart />
      </div>
    </div>
  </div>
</Shell>
