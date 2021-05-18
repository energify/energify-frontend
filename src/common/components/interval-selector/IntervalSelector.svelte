<script lang="ts">
  export let onChange: (interval: string) => void;
  let interval: string;
</script>

<select bind:value={interval} on:blur={() => onChange(interval)} class="input">
  <option value="1h" default>1h</option>
  <option value="1d">1d</option>
  <option value="1w">1w</option>
  <option value="1m">1m</option>
  <option value="1y">1y</option>
</select>
