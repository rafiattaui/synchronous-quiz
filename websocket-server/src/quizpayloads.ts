export interface QuizEvents {
    'player:join': { playerId: string, name: string };
}

export type EventPayload<T extends keyof QuizEvents> = QuizEvents[T];