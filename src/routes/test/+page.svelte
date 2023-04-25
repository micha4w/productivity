<script lang="ts">
    import Calendar from '$lib/Calendar/index.svelte';
    import { page } from '$app/stores';
    import { trpc } from '$lib/trpc/client';

    async function createTask({ detail }: CustomEvent) {
        await trpc($page).addTODO.query(detail);
    }
</script>

<Calendar on:createtask={createTask} />
