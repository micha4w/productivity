<script lang="ts">
    import { getMonths, getWeeks } from "./date-utlis";
    import { getToday } from "$lib/client/dates";
    import { createEventDispatcher, onMount } from "svelte";
    import { TodoType } from "$lib/types";

    const dispatch = createEventDispatcher();

    let repeatDays = 0;

    let selectedWeekDays = 0;
    let startWeek: number;
    let repeatWeeks = 1;

    let selectedMonthDays = 0;
    let startMonth: number;
    let repeatMonths = 1;

    let selecting = false;

    function createTask() {
        const newTodo: Todo = {
            type: typeId,
            points,
            title,
            start: "",
            frequency: 0,
            repeat: 0,
        };

        switch (typeId) {
            case TodoType.Daily:
                newTodo.start = getToday().toSQLDate()!;
                newTodo.repeat = repeatDays;
                newTodo.frequency = repeatDays;
                if (newTodo.frequency == 0) {
                    newTodo.frequency = 1;
                    newTodo.end = newTodo.start;
                }
                break;
            case TodoType.Weekly:
                const weekDay = getToday();
                newTodo.start = weekDay.toSQLDate()!;
                newTodo.repeat = selectedWeekDays;
                newTodo.frequency = repeatWeeks;
                if (newTodo.frequency == 0) {
                    newTodo.frequency = 1;
                    newTodo.end = weekDay.endOf("week").toSQLDate()!;
                }
                break;
            case TodoType.Monthly:
                const monthDay = getToday();
                newTodo.start = monthDay.toSQLDate()!;
                newTodo.repeat = selectedMonthDays;
                newTodo.frequency = repeatWeeks;
                if (newTodo.frequency == 0) {
                    newTodo.frequency = 1;
                    newTodo.end = monthDay.endOf("week").toSQLDate()!;
                }
                break;
        }

        dispatch("createtask", newTodo);
    }

    function toggleSelectedWeek(day: number) {
        if (typeId == TodoType.Weekly) {
            if (selecting) selectedWeekDays |= 1 << day;
            else selectedWeekDays &= ~(1 << day);
        }
    }
    function toggleSelectedMonth(day: number) {
        if (typeId == TodoType.Monthly) {
            if (selecting) selectedMonthDays |= 1 << day;
            else selectedMonthDays &= ~(1 << day);
        }
    }

    const typeNames = ["Daily Task", "Weekly Task", "Monthly Task"];
    let typeId = 0;
    let points = 10;
    let title = "";
</script>

<div class="date-time-picker" tabindex="-1">
    <div class="tab-container" tabindex="-1">
        <button class="header subtle-text-button">
            <input
                class="task-name"
                placeholder="Task Name"
                bind:value={title}
            />

            <div
                class="thumb-number"
                style="margin-left: {(215 / 99) * points -
                    1.5 * Math.floor(Math.log10(points))}px"
            >
                {points}
            </div>
            <div class="points-display">Points</div>
            <input
                type="range"
                class="points-slider"
                bind:value={points}
                min="1"
                max="100"
            />

            <div class="repeat-picker">
                <div
                    class="daily"
                    class:disabled={typeId != TodoType.Daily}
                    on:mousedown={() => (typeId = TodoType.Daily)}
                    on:keypress={() => (typeId = TodoType.Daily)}
                >
                    <div class="top">Daily Task</div>
                    <div class="week">
                        <span style="padding-right: 5px">Frequency: </span>
                        <input
                            class="days-picker"
                            type="number"
                            bind:value={repeatDays}
                            min="0"
                            max="100"
                        />
                        <span style="padding-left: 5px"
                            >day{#if repeatDays != 1}s{/if}</span
                        >
                    </div>
                </div>

                <div
                    class="weekly"
                    class:disabled={typeId != TodoType.Weekly}
                    on:mousedown={() => (typeId = TodoType.Weekly)}
                    on:keypress={() => (typeId = TodoType.Weekly)}
                >
                    <div class="top">Weekly Task</div>
                    <div class="week">
                        {#each ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as weekDay, i}
                            <div
                                class="cell"
                                class:selected={selectedWeekDays &
                                    (1 << (i + 1) % 7)}
                                on:mousedown={(e) => {
                                    if (e.buttons & 1) {
                                        selecting = !(
                                            selectedWeekDays &
                                            (1 << (i + 1) % 7)
                                        );
                                        toggleSelectedWeek((i + 1) % 7);
                                    }
                                }}
                                on:mouseenter={(e) => {
                                    if (e.buttons & 1)
                                        toggleSelectedWeek((i + 1) % 7);
                                }}
                            >
                                {weekDay}
                            </div>
                        {/each}
                    </div>
                    <div class="week up-seperate">
                        <span style="padding-right: 5px">Frequency: </span>
                        <input
                            class="days-picker"
                            type="number"
                            bind:value={repeatWeeks}
                            min="1"
                            max="53"
                        />
                        <span style="padding-left: 5px"
                            >week{#if repeatWeeks != 1}s{/if}</span
                        >
                    </div>
                    <div class="week" style="padding-top: 5px">
                        <span style="padding-right: 5px"> Start: </span>
                        <select class="start-picker" bind:value={startWeek}>
                            {#each getWeeks() as week}
                                <option value={week.number}>{week.name}</option>
                            {/each}
                        </select>
                    </div>
                </div>

                <div
                    class="monthly"
                    class:disabled={typeId != TodoType.Monthly}
                    on:mousedown={() => (typeId = TodoType.Monthly)}
                    on:keypress={() => (typeId = TodoType.Monthly)}
                >
                    <div class="top">Monthly Task</div>
                    {#each Array(5) as _, weekIndex}
                        <div class="week">
                            {#each Array(7) as _, dayIndex}
                                {@const i = weekIndex * 7 + dayIndex + 1}
                                {#if 31 >= i}
                                    <div
                                        class="cell"
                                        class:selected={selectedMonthDays &
                                            (1 << i)}
                                        on:mousedown={(e) => {
                                            if (e.buttons & 1) {
                                                selecting = !(
                                                    selectedMonthDays &
                                                    (1 << i)
                                                );
                                                toggleSelectedMonth(i);
                                            }
                                        }}
                                        on:mouseenter={(e) => {
                                            if (e.buttons & 1)
                                                toggleSelectedMonth(i);
                                        }}
                                    >
                                        <span>{i}</span>
                                    </div>
                                {:else}
                                    <div class="cell disabled">
                                        <span />
                                    </div>
                                {/if}
                            {/each}
                        </div>
                    {/each}

                    <div class="week up-seperate">
                        <span style="padding-right: 5px">Frequency: </span>
                        <input
                            class="days-picker"
                            type="number"
                            bind:value={repeatMonths}
                            min="1"
                            max="12"
                        />
                        <span style="padding-left: 5px"
                            >month{#if repeatMonths != 1}s{/if}</span
                        >
                    </div>
                    <div class="week" style="padding-top: 5px">
                        <span style="padding-right: 5px"> Start: </span>
                        <select class="start-picker" bind:value={startMonth}>
                            {#each getMonths() as months}
                                <option value={months.number}
                                    >{months.name}</option
                                >
                            {/each}
                        </select>
                    </div>
                </div>
            </div>

            <div class="submit">
                <input
                    type="button"
                    value="Create Task"
                    on:click={() => {
                        createTask();
                    }}
                />
            </div>
        </button>
    </div>
</div>

<style>
    .disabled {
        color: gray;
    }

    .up-seperate {
        padding-top: 15px;
        margin-top: 5px;
        border-top: 1px solid gray;
    }

    .points-display {
        text-align: center;
        position: absolute;
        left: 50%;
        transform: translateX(-50%);
        color: gray;
    }

    .thumb-number {
        text-align: center;
        position: absolute;
        margin-top: 13px;
        color: white;
        pointer-events: none;
        z-index: 1;
        width: 30px;
    }

    .points-slider {
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        cursor: pointer;
        width: 100%;
        height: 35px;
        transform: translateZ(1px);
        margin: 0px;
    }

    .points-slider::-moz-range-track {
        background: gray;
        height: 3px;
        border-radius: 1px;
    }

    .points-slider::-webkit-slider-runnable-track {
        background: gray;
        height: 3px;
        border-radius: 1px;
    }

    .points-slider::-moz-range-thumb {
        height: 25px;
        width: 25px;
        background-color: #333;
        border: 2px solid white;
        border-radius: 50%;
    }

    .points-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        box-sizing: content-box;
        appearance: none;
        height: 25px;
        width: 25px;
        background-color: #333;
        border: 2px solid white;
        border-radius: 50%;
        margin-top: -12.8px;
    }

    /* .points-slider:focus::-moz-range-thumb {
        border: 1px solid #053a5f;
        outline: 3px solid #053a5f;
        outline-offset: 0.125rem;
    }

    .points-slider:focus::-webkit-slider-thumb {
        border: 1px solid #053a5f;
        outline: 3px solid #053a5f;
        outline-offset: 0.125rem;
    } */

    .daily,
    .weekly,
    .monthly {
        border: 1px solid gray;
        border-radius: 3px;
        padding: 0.5rem;
    }

    .repeat-picker {
        text-align: center;
        display: flex;
        gap: 0.5rem;
    }

    .header {
        /* font-weight: 600; */
        text-align: center;
        font-size: 18px;
        padding-bottom: 3px;
        margin-bottom: 10px;
        border-bottom: 1px solid gray;
        text-align: center;
        width: 100%;
        border: none;
        background: none;
    }

    .task-name {
        text-align: center;
        width: 100%;
        margin-bottom: 5px;
        box-sizing: border-box;
    }

    .submit {
        display: flex;
        margin-top: 15px;
        justify-content: center;
    }

    .days-picker {
        width: 40px;
        text-align: left;
        margin-top: -3px;
    }

    .date-time-picker {
        color: var(--date-picker-foreground, #000000);
        background: var(--date-picker-background, #ffffff);

        user-select: none;
        -webkit-user-select: none;

        padding: 0.5rem;
        cursor: default;
        font-size: 0.75rem;
        border: 1px solid rgba(103, 113, 137, 0.3);
        border-radius: 3px;
        box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.08),
            0px 2px 6px rgba(0, 0, 0, 0.11);
        outline: none;

        transition: all 80ms cubic-bezier(0.4, 0, 0.2, 1);
    }

    .date-time-picker:focus {
        border-color: var(--date-picker-highlight-border, #0269f7);
        box-shadow: 0px 0px 0px 2px
            var(--date-picker-highlight-shadow, rgba(2, 105, 247, 0.4));
    }

    .tab-container {
        outline: none;
    }

    .top {
        border-bottom: 2px solid gray;
        padding-bottom: 0.3rem;
        margin-bottom: 0.5rem;
    }

    .week {
        display: flex;
        justify-content: center;
    }

    .cell {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2rem;
        height: 1.94rem;
        flex-grow: 1;
        border-radius: 5px;
        box-sizing: border-box;
        border: 2px solid transparent;
    }

    .cell:hover {
        border: 1px solid rgba(128, 128, 128, 0.08);
        background-color: rgba(128, 128, 128, 0.08);
    }

    .cell.disabled {
        visibility: hidden;
    }

    .cell.disabled:hover {
        border: none;
        background-color: transparent;
    }

    .cell.selected {
        color: var(--date-picker-selected-color, inherit);
        background: var(--date-picker-selected-background, #aaa);
        border: 2px solid var(--date-picker-highlight-border, #333);
    }
</style>
