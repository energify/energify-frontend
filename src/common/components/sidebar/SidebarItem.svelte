<script lang="ts">
  import Icon from "svelte-hero-icons";
  import active from "svelte-spa-router/active";

  export let name: string;
  export let icon: any;
  export let link: string;
</script>

<div class="py-1">
  <a
    use:active={{
      path: link.replace("#", ""),
      className: "bg-gray-100 text-gray-900",
      inactiveClassName: "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
    }}
    href={link}
    class="mx-1 group flex items-center px-4 py-2 text-md font-medium rounded-md"
  >
    <Icon src={icon} solid class="w-6 h-6 mr-2" />
    {name}
  </a>
</div>
