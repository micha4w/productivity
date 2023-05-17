<script lang="ts">
    import { dndzone } from "svelte-dnd-action";
    import { flip } from "svelte/animate";
    import { DateTime } from "luxon";
    import { getToday } from "$lib/client/dates";
    import { trpc } from "$lib/trpc/client";
    import { onMount } from "svelte";
    import { page } from "$app/stores";
    import TodoButton from "./TodoButton.svelte";
    import Calendar from "$lib/Calendar/index.svelte";
    import NotePlus from "svelte-material-icons/NotePlus.svelte";
    import Delete from "svelte-material-icons/Delete.svelte";

    export let updateChart: (score?: Score) => Promise<void>;

    export async function changeDay(date: DateTime) {
        activeDay = date.toSQLDate()!;

        await completeUpdate();

        disabled = activeDay != getToday().toSQLDate();
    }

    let disabled = false;
    let todoCreator: HTMLElement;
    let todoCreatorActive = false;
    const flipDurationMs = 200;

    let todaysTodos: Todo[] = [];
    let todaysDones: Todo[] = [];

    let activeDay = getToday().toSQLDate()!;

    async function completeUpdate() {
        let [newTodos, _] = await Promise.all([
            trpc($page).getTODOs.query(activeDay),
            updateChart(),
        ]);
        function sortFilter(todos: Todo[], todoA: Todo, todoB: Todo): number {
            return (
                todos.findIndex((canditate) => canditate.id === todoA.id) -
                todos.findIndex((canditate) => canditate.id === todoB.id)
            );
        }

        todaysDones = newTodos
            .filter((todo) => todo.done)
            .sort((a, b) =>
                sortFilter(todaysDones, a as Todo, b as Todo)
            ) as Todo[];
        todaysTodos = newTodos
            .filter((todo) => !todo.done)
            .sort((a, b) =>
                sortFilter(todaysTodos, a as Todo, b as Todo)
            ) as Todo[];

        updateChart();
    }

    async function todoChecked(todo: Todo | undefined, done: boolean) {
        if (!todo) return;

        if (todo.done != done) {
            const factor = done ? 1 : -1;
            updateChart({ points: todo.points * factor, todos: factor });

            await trpc($page).checkTODO.query({
                id: todo.id!,
                done,
                day: activeDay,
            });
        }

        await completeUpdate();
    }

    async function todoRemove(id: number | undefined) {
        let todo = todaysDones.find((todo) => todo.id === id)!;
        if (todo) {
            updateChart({ points: -todo.points, todos: -1 });
            todaysDones = todaysDones.filter((todo) => todo.id !== id);
        } else {
            todo = todaysTodos.find((todo) => todo.id === id)!;
        }

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

        setTimeout(
            midnight,
            (getToday(+1).toSeconds() - DateTime.now().toSeconds() + 30) * 1_000
        ); // Add 1 minute delay to make sure we are in the correct day
    }

    onMount(() => {
        midnight();
        document.addEventListener("click", (event: MouseEvent) => {
            if (
                todoCreator &&
                !todoCreator.contains(event.target as HTMLElement)
            ) {
                todoCreatorActive = false;
            }
        });

        document.addEventListener("keypress", (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                todoCreatorActive = false;
            }
        });
    });
</script>

{#if todoCreatorActive}
    <div bind:this={todoCreator} class="todoCreator">
        <Calendar on:createtask={todoCreate} />
    </div>
{/if}

<div class="flexContainer">
    <div class="wrapper" class:disabled>
        <div class="header">
            <h3>ToDo</h3>
            <button
                class="addButton"
                on:click|stopPropagation={() =>
                    (todoCreatorActive = !todoCreatorActive)}
                ><NotePlus size="1.5rem" viewBox="0 0 24 22.5" /></button
            >
        </div>

        <section
            class="container"
            use:dndzone={{
                items: todaysTodos,
                flipDurationMs,
                dropTargetStyle: {},
                dragDisabled: disabled,
            }}
            on:consider={(e) => {
                todaysTodos = e.detail.items.filter(Boolean);
            }}
            on:finalize={(e) => {
                todaysTodos = e.detail.items.filter(Boolean);
                if (e.detail.info.trigger === "droppedIntoZone") {
                    todoChecked(
                        todaysTodos.find(
                            (todo) => todo.id === +e.detail.info.id
                        ),
                        false
                    );
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
            use:dndzone={{
                items: todaysDones,
                flipDurationMs,
                dropTargetStyle: {},
                dragDisabled: disabled,
            }}
            on:consider={(e) => (todaysDones = e.detail.items.filter(Boolean))}
            on:finalize={(e) => {
                todaysDones = e.detail.items.filter(Boolean);
                if (e.detail.info.trigger === "droppedIntoZone") {
                    todoChecked(
                        todaysDones.find(
                            (todo) => todo.id === +e.detail.info.id
                        ),
                        true
                    );
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
    <div class="overlayer">
        <div
            class="trash"
            use:dndzone={{
                items: [],
                flipDurationMs,
                dropTargetStyle: {},
                dropTargetClasses: ["shown"],
            }}
            on:consider={(e) => e.detail.items}
            on:finalize={(e) => {
                todoRemove(+e.detail.info.id);
            }}
        />
        <div class="deleteIcon"><Delete size="5rem" color="#AA0011" /></div>
    </div>
</div>

<style>
    h3 {
        margin: 0px;
    }

    .todoCreator {
        position: absolute;
        right: 2rem;
        top: 5rem;
        z-index: 10;
    }

    .header {
        color: var(--primary-text-color);
        border-bottom: 2px solid var(--primary-accent-color);
        padding: 0.5em;
        margin: 0.5em;
        display: flex;
        position: relative;
        align-items: center;
    }

    .addButton {
        display: flex;
        position: absolute;
        height: 100%;
        aspect-ratio: 1;
        right: 0;
        bottom: 0.25rem;
        border: none;
        border-radius: 50%;
        background: none;
    }

    .addButton:hover {
        background-color: var(--primary-color);
        border: 2px solid var(--primary-accent-color);
    }

    .wrapper {
        background-color: var(--secondary-background-color);
        border: 3px solid var(--primary-accent-color);
        border-radius: 0.5rem;
        display: flex;
        flex-direction: column;
        flex: 1;
    }

    .disabled {
        filter: saturate(25%) brightness(75%);
    }

    .flexContainer {
        display: flex;
        flex-direction: column;
        height: 100%;
        gap: 0.5rem;
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

    .overlayer {
        position: absolute;
        right: 1.5rem;
        bottom: 1.5rem;
    }

    .deleteIcon {
        display: flex;
        position: relative;
        z-index: 100;
    }

    .trash {
        position: absolute;
        top: 0;
        left: 0;
        z-index: -100;
        width: 100%;
        height: 100%;

        transition: 0.4s ease-in-out;

        /* transform: scale(0%);
        opacity: 0; */
    }

    .trash:global(.shown) {
        transform: scale(100%);
        opacity: 1;
    }

    .trash:hover {
        transform: rotate(10);
    }
</style>
