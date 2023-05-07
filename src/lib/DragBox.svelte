<script lang="ts">
    import { dndzone } from 'svelte-dnd-action';
    import { flip } from 'svelte/animate';
    import { DateTime } from 'luxon';
    import { getToday } from '$lib/client/dates';
    import { trpc } from '$lib/trpc/client';
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import TodoButton from './TodoButton.svelte';
    import NotePlus from 'svelte-material-icons/NotePlus.svelte';

    export let updateChart: (score?: Score) => Promise<void>;

    export async function changeDay(date: DateTime) {
        activeDay = date.toSQLDate()!;

        await completeUpdate();

        disabled = activeDay != getToday().toSQLDate();
    }

    let disabled = false;
    const flipDurationMs = 200;

    let todaysTodos: Todo[] = [];
    let todaysDones: Todo[] = [];

    let activeDay = getToday().toSQLDate()!;

    async function completeUpdate() {
        let [newTodos, _] = await Promise.all([trpc($page).getTODOs.query(activeDay), updateChart()]);
        todaysDones = newTodos.filter((todo) => todo.done) as Todo[];
        todaysTodos = newTodos.filter((todo) => !todo.done) as Todo[];

        updateChart();
    }

    async function todoChecked(todo: Todo | undefined, done: boolean) {
        if (!todo) return;

        const factor = done ? 1 : -1;
        updateChart({ points: todo.points * factor, todos: factor });

        await trpc($page).checkTODO.query({ id: todo.id!, done, day: activeDay });

        await completeUpdate();
    }

    async function todoRemove(id: number | undefined) {
        const todo = todaysTodos.find((todo) => todo.id === id)!;

        if (todo.done) {
            const score: Score = { points: -todo.points, todos: -1 };
            updateChart(score);
        }

        todaysTodos = todaysTodos.filter((todo) => todo.id !== id);
        await trpc($page).removeTODO.query({ id: id!, day: activeDay });

        await completeUpdate();
    }

    async function todoCreate({ detail }: CustomEvent) {
        const todo = detail as Todo;

        todaysTodos.push(todo);
        await trpc($page).addTODO.query(todo);
        await completeUpdate();
    }

    async function midnight() {
        activeDay = getToday().toSQLDate()!;
        await completeUpdate();
        updateChart();

        setTimeout(midnight, (getToday(+1).toSeconds() - DateTime.now().toSeconds() + 30) * 1_000); // Add 1 minute delay to make sure we are in the correct day
    }

    onMount(() => {
        midnight();
    });
</script>

<div class="flexContainer">
    <div class="wrapper" class:disabled>
        <div class="header">
            <h3>ToDo</h3>
            <button class="addButton"><NotePlus size="1.5rem" viewBox="0 0 24 22.5" /></button>
        </div>

        <section
            class="container"
            use:dndzone={{ items: todaysTodos, flipDurationMs, dropTargetStyle: {}, dragDisabled: disabled }}
            on:consider={(e) => {
                todaysTodos = e.detail.items;
            }}
            on:finalize={(e) => {
                todaysTodos = e.detail.items;
                if (e.detail.info.trigger === 'droppedIntoZone') {
                    todoChecked(todaysTodos.find(todo => todo.id === +e.detail.info.id), false);
                }
            }}
        >
            {#each todaysTodos as todo (todo.id)}
                <div animate:flip={{ duration: flipDurationMs }}>
                    <TodoButton {todo} />
                </div>
            {/each}
        </section>
    </div>
    <div class="wrapper" class:disabled>
        <div class="header">
            <h3>Done</h3>
        </div>

        <section
            class="container"
            use:dndzone={{ items: todaysDones, flipDurationMs, dropTargetStyle: {}, dragDisabled: disabled }}
            on:consider={(e) => (todaysDones = e.detail.items)}
            on:finalize={(e) => {
                todaysDones = e.detail.items;
                if (e.detail.info.trigger === 'droppedIntoZone') {
                    todoChecked(todaysDones.find(todo => todo.id === +e.detail.info.id), true);
                }
            }}
        >
            {#each todaysDones as todo (todo.id)}
                <div animate:flip={{ duration: flipDurationMs }}>
                    <TodoButton {todo} />
                </div>
            {/each}
        </section>
    </div>
</div>

<style>
    h3 {
        margin: 0px;
    }

    .header {
        color: var(--text-color);
        border-bottom: 2px solid var(--accent-color);
        padding: 0.5em;
        margin: 0.5em;
        display: flex;
        position: relative;
        align-items: center;
    }

    .addButton {
        position: absolute;
        height: 100%;
        aspect-ratio: 1;
        right: 0;
        bottom: 0.25rem;
        border: none;
        border-radius: 10%;
        background: none;
    }

    .addButton:focus,
    .addButton:hover {
        background-color: red;
    }

    .wrapper {
        background-color: var(--secondary-background-color);
        border: 3px solid var(--accent-color);
        border-radius: 0.5rem;
        display: flex;
        flex-direction: column;
        flex: 1;
        margin: 0.5rem;
    }

    .disabled {
        filter: saturate(25%) brightness(75%);
    }

    .flexContainer {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .container {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        align-content: flex-start;
        gap: 0.5rem;
        padding: 0.2rem;
        flex-grow: 1;
        border-radius: 1rem;
    }
</style>
