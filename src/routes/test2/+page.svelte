<script lang="ts">
    import { tap } from "@trpc/server/observable";
</script>

<input
    class="checkbox"
    type="checkbox"
    on:click={(e) => { console.log((e.target)) }}
/>