import { getToday } from "$lib/client/dates";
import { DateTime } from "luxon";

function padZeroes(num: number, places: number) {
    return String(num).padStart(places, '0');
}

export function getWeeks() {
    const today = DateTime.now();
    let monday = today.set({weekday: 1})
    const weeks = [];

    while (monday.year <= today.year) {
        const week = monday.weekNumber;
        const sunday = monday.set({day: monday.day + 6});

        weeks.push({ number: week, name: `${monday.weekNumber} (${monday.toFormat('dd LLL')} - ${sunday.toFormat('dd LLL')})` });
        
        monday = sunday.set({day: sunday.day + 1})
    }

    return weeks;
}

export function getMonths() {
    let firstDay = DateTime.local().startOf('month');
    const startMonth = firstDay.month
    const months = [];

    do {
        months.push({ number: firstDay.month, name: firstDay.monthLong });

        firstDay = firstDay.set({month: firstDay.month + 1});
    } while (firstDay.month != startMonth);

    return months;
}
