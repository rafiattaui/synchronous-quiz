import { Server, Socket } from "socket.io";
import express, { request, response } from "express";
import type { Express } from "express";
import { createServer } from "http";
import { dirname, join } from "path";
import * as qi from "./quizinterface.ts";
import type { EventPayload, QuizEvents } from "./quizpayloads.ts";
import { QuizSchemas } from "./quizpayloads.ts";
import * as z from "zod";
import * as h from "./quizfunctions.ts"

type SocketHandler<T extends keyof QuizEvents> = (
    io: Server, 
    socket: Socket, 
    data: EventPayload<T>,
) => void;
    
type StateActions = {
    [K in keyof QuizEvents]?: SocketHandler<K>;
}

type StateMachine = {
    [K in qi.QuizStateEnumType]: StateActions;
}

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

const QuizState: qi.QuizState = {
    quizId: '0',
    players: {},    
    socketIdToUserId: {},
    currentQuestion: null,
    state: qi.QuizStateEnum.LOBBY,
    phaseEndsAt: null,
}

const stateHandlers: StateMachine = {
    [qi.QuizStateEnum.LOBBY]: {
        'player:join': (io, socket, data) => h.handlePlayerJoin(io, socket, data, QuizState),
        'pong': (io, socket, data) => h.handlePong(io, socket, data),
        'disconnect': (io, socket, data) => h.handlePlayerDisconnect(io, socket, data, QuizState),
    },
    [qi.QuizStateEnum.QUESTION_ANSWERING]: {},
    [qi.QuizStateEnum.PREQUESTION_COUNTDOWN]: {},
    [qi.QuizStateEnum.QUESTION_REVEALED]: {},
    [qi.QuizStateEnum.ANSWER_REVEALED]: {},
    [qi.QuizStateEnum.LEADERBOARD]: {},
    [qi.QuizStateEnum.FINISHED]: {},
};

io.on("connection", (socket) => {
    socket.onAny((eventName, rawBuffer: any) => { 
        const currentState: qi.QuizStateEnumType = QuizState.state;
        const stateLogic = stateHandlers[currentState as qi.QuizStateEnumType];

        if (!(eventName in QuizSchemas)){
            console.warn(`Unknown Event: ${eventName}`);
            return;
        }

        const handler = stateLogic[eventName as keyof QuizEvents];

        if (handler) {
            const schema = QuizSchemas[eventName as keyof typeof QuizSchemas];
            const result = schema.safeParse(rawBuffer);

            if (!result.success){
                console.log(z.flattenError(result.error as z.ZodError));
                socket.emit("error", result.error)
            } else {
                (handler as SocketHandler<any>)(io, socket, result.data)
            }

        } else {
            console.warn(`No handler for event ${eventName} in state ${currentState}`);
            socket.emit("error", `Event ${eventName} not allowed in state ${currentState}`);
        }
    });

    socket.on("disconnect", (reason) =>{
        h.handlePlayerDisconnect(io, socket, {reason}, QuizState)
    });
});

httpServer.listen(3001, () => {
    console.log("listening on *:3001");
});

