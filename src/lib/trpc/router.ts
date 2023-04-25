import type { Context } from '$lib/trpc/context';
import { initTRPC } from '@trpc/server';
import { getTODOs, addTODO, checkTODO, removeTODO, getScores } from '$lib/server/database.js';
import { z } from 'zod';

export const t = initTRPC.context<Context>().create();



export const router = t.router({
    getScores: t.procedure.input(z.object({ start: z.string().optional(), end: z.string() })).query((req) => {
        return getScores(req.input.start || null, req.input.end);
    }),
    getTODOs: t.procedure.input(z.string()).query((req) => {
        return getTODOs(req.input);
    }),
    addTODO: t.procedure.input(z.object({
        title: z.string(),
        points: z.number(),
        start: z.string(),
        type: z.number(),
        frequency: z.number(),
        repeat: z.number(),
    })).query((req) => {
        return addTODO(req.input);
    }),
    checkTODO: t.procedure.input(z.object({id: z.number(), done: z.boolean(), day: z.string()})).query((req) => {
        return checkTODO(req.input.id, req.input.done, req.input.day);
    }),
    removeTODO: t.procedure.input(z.object({id: z.number(), day: z.string()})).query((req) => {
        return removeTODO(req.input.id, req.input.day);
    }),
});

export type Router = typeof router;