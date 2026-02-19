import { Server, Socket } from "socket.io";
import express, { request, response } from "express";
import type { Express } from "express";
import { createServer } from "http";
import { dirname, join } from "path";
import * as qi from "./quizinterface.ts";
import type { EventPayload, QuizEvents } from "./quizpayloads.ts";

type SocketHandler<T extends keyof QuizEvents> = (
    io: Server, 
    socket: Socket, 
    data: EventPayload<T>
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
        'player:join': (io, socket, data) => {
            // TypeScript knows 'data' has 'playerId' and 'name'
            console.log(`Player ${data.name} joined.`);
            socket.emit("player:joined", { id: data.playerId });
        },
    },
    [qi.QuizStateEnum.QUESTION_ANSWERING]: {},
    // The rest of the states...
    [qi.QuizStateEnum.PREQUESTION_COUNTDOWN]: {},
    [qi.QuizStateEnum.QUESTION_REVEALED]: {},
    [qi.QuizStateEnum.ANSWER_REVEALED]: {},
    [qi.QuizStateEnum.LEADERBOARD]: {},
    [qi.QuizStateEnum.FINISHED]: {},
};

io.on("connection", (socket) => {
    socket.onAny((eventName, data) => { 
        const currentState: qi.QuizStateEnumType = QuizState.state;
        const stateLogic = stateHandlers[currentState as qi.QuizStateEnumType];

        const handler = stateLogic[eventName as keyof QuizEvents];

        if (handler) {
            handler(io, socket, data);
        } else {
            console.warn(`No handler for event ${eventName} in state ${currentState}`);
            socket.emit("error", `Event ${eventName} not allowed in state ${currentState}`);
        }
    })
});

httpServer.listen(3001, () => {
    console.log("listening on *:3001");
});

