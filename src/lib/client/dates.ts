import { DateTime } from 'luxon';

export function getToday(offsetDays = 0): DateTime {
    const day = DateTime.now();

    if (day.hour >= 4)
        return day.set({day: day.day + offsetDays, hour: 4, minute: 0, second: 0, millisecond: 0});
    else
        return day.set({day: day.day + offsetDays - 1, hour: 4, minute: 0, second: 0, millisecond: 0});
}
