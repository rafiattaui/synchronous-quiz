import { z } from "zod";

export const QuizSchemas = {
    'pong' : z.object({
        time: z.number(),
    }),
    'player:join': z.object({
        userId: z.string(), // use string for now, switch to uuid later
        name: z.string().min(2).max(32), 
    }),
    'disconnect': z.object({
        'reason': z.string(),
    })
} as const;

export type QuizEvents = {
    [K in keyof typeof QuizSchemas] : z.infer<typeof QuizSchemas[K]>;
};

export type EventPayload<K extends keyof QuizEvents> = QuizEvents[K];

