<script lang="ts">
    import Chart from '$lib/Chart.svelte';

    // import Calendar from '$lib/Calendar/index.svelte';
    import DragBox from '$lib/DragBox.svelte';

    let chart: Chart;
    let dragBox: DragBox;
</script>

<div class="container">
    <div class="graphBox">
        <Chart bind:this={chart} on:click={(event) => dragBox.changeDay(event.detail)} />
    </div>
    <div class="doneBox">
        <DragBox bind:this={dragBox} updateChart={(score) => chart.update(score)} />

        <!-- <Calendar on:createtask={todoCreate} /> -->
    </div>
</div>

<style>
    .container {
        width: 100dvw;
        height: 100dvh;
        display: flex;
        align-items: stretch ;
        justify-content: space-evenly;
        gap: .5rem;
        padding: 1rem;
    }

    .graphBox {
        grid-area: graph;
        align-self: center;
        height: 100%;
        flex: 1;
    }

    .doneBox {
        grid-area: tasks;
        flex: 1.618;
    }
</style>


<!-- <div id="uiWrapper">
    {#if todaysTodos}
        <Calendar on:createtask={todoCreate} />

        <br />
        <table style="width: min(50vw, 300px)">
            {#each todaysTodos as todo (todo.id)}
                <tr>
                    <td style="width: 30px"
                        ><input
                            class="checkbox"
                            type="checkbox"
                            on:click={(e) => {
                                todoChecked(todo.id, e);
                            }}
                            checked={todo.done}
                            disabled={!editable}
                        /></td
                    >
                    <td>{todo.title}</td>
                    <td>{todo.points}</td>
                    {#if editable}<td style="width: 20px"
                        ><input class="remove" type="button" value="-" on:click={() => todoRemove(todo.id)} /></td
                    >{/if}
                </tr>
            {/each}
        </table>
    {:else}
        Loading...
    {/if}
</div> -->