<script lang="ts">
    import { browser } from '$app/environment';
    import { createEventDispatcher, onMount } from 'svelte';

    const dispatch = createEventDispatcher();

    import { Line, getElementAtEvent } from 'svelte-chartjs';
    import {
        Chart as ChartJS,
        Title,
        Tooltip,
        Legend,
        LineElement,
        LinearScale,
        PointElement,
        CategoryScale,
        Filler,
        TimeScale,
        type ChartData
    } from 'chart.js';
    import 'chartjs-adapter-luxon';

    ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale, Filler, TimeScale);

    import { page } from '$app/stores';
    import { trpc } from '$lib/trpc/client';
    import { getToday } from './client/dates';
    import type { ChartOptions } from 'chart.js/dist/types/index';
    import { DateTime } from 'luxon';
    import { set } from 'zod';

    export async function update(score? : Score) {
        if (!browser) return;

        if (score) {
            data.datasets[0].data[0] += score.todos;
            data.datasets[1].data[0] += score.points;
            return;
        }

        const end = getToday();

        let scores: [ISODate, Score][];
        let day: DateTime;
        if (daysBack == -1) {
            scores = await trpc($page).getScores.query({ end: end.toSQLDate()! });

            if (scores.length > 0)
                day = DateTime.fromISO(scores[0][0]);
            else
                day = end;
        } else {
            day = getToday(-daysBack + 1);
            scores = await trpc($page).getScores.query({ start: day.toSQLDate()!, end: end.toSQLDate()! });
        }


        const labels : DateTime[] = [];
        const todos : number[] = [];
        const points : number[] = [];

        for (let i = 0; day <= end; day = day.set({day: day.day + 1})) {
            const sqlDay = day.toSQLDate();
            labels.push(day);

            if (i < scores.length && scores[i][0] == sqlDay) {
                todos.push(scores[i][1].todos);
                points.push(scores[i][1].points);
                i++;
            } else {
                todos.push(0);
                points.push(0);
            }
        }

        data.labels = labels.reverse();
        data.datasets[0].data = todos.reverse();
        data.datasets[1].data = points.reverse();
    }

    function setMonth() {
        let d = new Date();
        d.setDate(0);
        daysBack = d.getDate();
    }

    function setYear() {
        const year = new Date().getFullYear();
        daysBack = (year % 4 === 0 && year % 100 > 0) || year % 400 == 0 ? 366 : 365;
    }

    function setAllTime() {
        daysBack = -1;
    }

    function onClick(event: CustomEvent) {
        const elements = getElementAtEvent(chart, event as unknown as PointerEvent);
        if (elements.length)
            dispatch('click', data.labels![elements[0].index]);
    }

    let data: ChartData<'line', number[], DateTime> = {
        datasets: [
            {
                data: [],
                label: 'Todos',
                yAxisID: 'todosY',
                cubicInterpolationMode: 'monotone'
            },
            {
                data: [],
                label: 'Points',
                yAxisID: 'pointsY',
                cubicInterpolationMode: 'monotone'
            }
        ]
    };
    
    onMount(() => {
        data.datasets.forEach(set => {
            set.borderColor = getComputedStyle(document.body).getPropertyValue('--accent-color');
        })
    })

    const options: ChartOptions<'line'> = {
        responsive: true,
        maintainAspectRatio: false,
        // onResize: console.log,
        plugins: {
            title: {
                display: true,
                text: 'A line graph to show tasks completed over the days.'
            }
        },
        interaction: {
            intersect: false
        },
        scales: {
            x: {
                type: 'time',
                time: {
                    // Luxon format string
                    tooltipFormat: 'dd LLL yyyy',
                    unit: 'day'
                },
                title: {
                    display: true,
                    text: 'Date'
                },
                grid: {
                    color: '#222222'
                }
            },
            todosY: {
                type: 'linear',
                beginAtZero: true,
                position: 'left',
                grid: {
                    drawOnChartArea: false
                }
            },
            pointsY: {
                type: 'linear',
                beginAtZero: true,
                position: 'right',
                grid: {
                    color: '#222222'
                }
            }
        }
    };

    let chart: ChartJS<'line', number[], DateTime>;
    let daysBack = 7;

    $: daysBack && update();
</script>

<div id="wrapper">
    <div id="buttons">
        <input
            type="button"
            value="Past week"
            on:click={() => {
                daysBack = 7;
            }}
        />
        <input type="button" value="Past month" on:click={setMonth} />
        <input type="button" value="Past year" on:click={setYear} />
        <input type="button" value="All time" on:click={setAllTime} />
    </div>
    <div id="lineWrapper">
        <Line bind:chart on:click={onClick} {data} {options} />
        <!-- <div style="width: 100%; height: 100%; background-color: red;"></div> -->
    </div>
</div>

<style>
    #buttons {
        flex: 0 1 auto;
        display: flex;
        justify-content: center;
    }

    input[type='button'] {
        margin: 2px;
        border: none;
        text-align: center;
        text-decoration: none;
        position: center;
        padding: 10px;
        font-size: 16px;
        width: 120px;
        background-color: var(--secondary-background-color);
        font-weight: bold;
    }

    #lineWrapper {
        height: 300px;
        flex: 1 1 auto;
    }

    #wrapper {
        display: flex;
        flex-flow: column;
        height: 100%;
        width: 100%;
    }
</style>
