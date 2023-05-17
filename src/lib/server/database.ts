import Database from 'better-sqlite3';
import { TodoType } from '$lib/types';
import fs from 'fs';
import { DateTime } from 'luxon';
import { date } from 'zod';

if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
}

const DB_PATH = './data/todos.db';
const db = new Database(DB_PATH  /*,{ verbose: console.log }*/);

db.prepare(
    'CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, points INTEGER, start DATE, end DATE, type TINYINT, frequency TINYINT, repeat INT)'
).run();
db.prepare(
    'CREATE TABLE IF NOT EXISTS doneTodos (todoId INTEGER, day DATE, FOREIGN KEY(todoId) REFERENCES todos(id), PRIMARY KEY(todoId, day))'
).run();

export function getTODOs(day: SQLDate): Todo[] {
    try {
        return db
            .prepare(`
                SELECT id, title, points, start, end, type, frequency, repeat, EXISTS (SELECT * FROM doneTodos WHERE todoId == id AND day == @day) AS done FROM todos
                    WHERE start <= @day AND (end IS NULL OR end >= @day) AND
                    (
                        (type == ${TodoType.Daily} AND FLOOR(JULIANDAY(@day) - JULIANDAY(start)) % frequency == 0) OR
                        (type == ${TodoType.Weekly} AND FLOOR((JULIANDAY(@day) - JULIANDAY(start)) / 7) % frequency == 0 AND (1<<STRFTIME('%w',@day)) & repeat) OR
                        (type == ${TodoType.Monthly} AND (STRFTIME('%Y',@day)*12+STRFTIME('%m',@day)-STRFTIME('%Y',start)*12-STRFTIME('%m',start)) % frequency == 0 AND (1<<STRFTIME('%d',@day)) & repeat)
                    )
                `)
            .all({ day }) as Todo[];
    } catch (dbError) {
        console.error(dbError);
        return [];
    }
}

export function getScores(startDay: SQLDate | null, endDay: SQLDate): [SQLDate, Score][] {
    try {
        const scores = db
            .prepare(
                startDay
                    ? `SELECT day, COUNT(*) as todos, SUM(points) as points FROM (
                            SELECT day, points FROM doneTodos INNER JOIN todos ON todoId == todos.id WHERE day BETWEEN @startDay AND @endDay
                        ) GROUP BY day`
                    : `SELECT day, COUNT(*) as todos, SUM(points) as points FROM (
                            SELECT day, points FROM doneTodos INNER JOIN todos ON todoId == todos.id WHERE day <= @endDay
                        ) GROUP BY day`
            )
            .all({ startDay, endDay });

        return scores.map((s: any) => [s.day, { todos: s.todos, points: s.points }]);
    } catch (dbError) {
        console.error(dbError);
        return [];
    }
}

export function addTODO(todo: Todo): number | bigint {
    try {
        if (todo.frequency == 0) {
            todo.frequency = 1;

            switch (todo.type) {
                case TodoType.Daily:
                    todo.end = todo.start;
                    break;
                case TodoType.Weekly:
                    todo.end = DateTime.fromSQL(todo.start).endOf('week').toSQLDate()!;
                    break;
                case TodoType.Monthly:
                    todo.end = DateTime.fromSQL(todo.start).endOf('month').toSQLDate()!;
                    break;
            }

            return db
                .prepare(
                    'INSERT INTO todos (title, points, start, end, type, frequency, repeat) VALUES (@title, @points, @start, @end, @type, @frequency, @repeat)'
                )
                .run(todo).lastInsertRowid;
        } else {
            return db
                .prepare(
                    'INSERT INTO todos (title, points, start, end, type, frequency, repeat) VALUES (@title, @points, @start, NULL, @type, @frequency, @repeat)'
                )
                .run(todo).lastInsertRowid;
        }
    } catch (dbError) {
        console.error(dbError);
        return -1;
    }
}

export function checkTODO(todoId: number, done: boolean, day: SQLDate): Score {
    // TODO check if day is today (including timezone)
    try {
        if (done) {
            const result = db
                .prepare(`
                    SELECT title, points, start, end, type, frequency, repeat FROM todos
                        WHERE id == @todoId AND start <= @day AND (end IS NULL OR end >= @day) AND
                        (
                            (type == ${TodoType.Daily} AND FLOOR(JULIANDAY(@day) - JULIANDAY(start)) % frequency == 0) OR
                            (type == ${TodoType.Weekly} AND FLOOR((JULIANDAY(@day) - JULIANDAY(start)) / 7) % frequency == 0 AND (1<<STRFTIME('%w',@day)) & repeat) OR
                            (type == ${TodoType.Monthly} AND (STRFTIME('%Y',@day)*12+STRFTIME('%m',@day)-STRFTIME('%Y',start)*12-STRFTIME('%m',start)) % frequency == 0 AND (1<<STRFTIME('%d',@day)) & repeat)
                        )
                    `)
                .get({ todoId, day });
            if (result === undefined) return { points: -1, todos: -1 };

            db.prepare('INSERT INTO doneTodos (todoId, day) VALUES (?, ?)').run(todoId, day);
        } else {
            db.prepare('DELETE FROM doneTodos WHERE todoId == ? AND day == ?').run(todoId, day);
        }
        
        return getScores(day, day)[0][1];
    } catch (dbError) {
        console.error(dbError);

        return { todos: -1, points: -1 };
    }
}

export function removeTODO(todoId: number, day: SQLDate) {
    // TODO check if day is no more than 1 day back (including timezone)
    try {
        const { start } = db.prepare('SELECT start FROM todos WHERE id == ?').get(todoId) as any;

        checkTODO(todoId, false, day)
        if (day == start) db.prepare('DELETE FROM todos WHERE id == ?').run(todoId);
        else {
            const date = DateTime.fromSQL(day);
            day = date.set({day: date.day -1}).toSQLDate()!;

            db.prepare('UPDATE todos SET end == ? WHERE id == ? AND end IS NULL').run(day, todoId);
        }
    } catch (dbError) {
        console.error(dbError);
    }
}
