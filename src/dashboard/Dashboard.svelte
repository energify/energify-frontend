<script lang="ts">
  import Shell from "../common/components/shell/Shell.svelte";
  import EnergyHistory from "./components/EnergyHistory.svelte";
  import EnergyFlowChart from "./components/EnergyFlowChart.svelte";
  import MonthlyResume from "./components/MonthlyResume.svelte";
  import { usersService } from "../common/services/users.service";
</script>

<Shell title="Dashboard">
  <div class="grid grid-cols-12 gap-12">
    <div class="col-span-12 xl:col-span-6">
      <EnergyHistory />
    </div>
    <div class="col-span-12 xl:col-span-6">
      <div class="mb-8">
        <MonthlyResume />
      </div>
      <div>
        <EnergyFlowChart />
      </div>
    </div>
  </div>
</Shell>
