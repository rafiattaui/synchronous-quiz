import { Server, Socket } from "socket.io";
import express, { request, response } from "express";
import type { Express } from "express";
import { createServer } from "http";
import { dirname, join } from "path";
import * as q from "./quizinterface.ts";

type SocketHandler = (io: Server, socket: Socket, data: any) => void;

interface StateActions {
    [eventName: string]: SocketHandler;
}

type stateMachine = {
    [K in keyof typeof q.QuizStateEnum]: StateActions;
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

const QuizState: q.QuizState = {
    quizId: '0',
    players: {},    
    socketIdToUserId: {},
    currentQuestion: null,
    state: q.QuizStateEnum.LOBBY,
    phaseEndsAt: null,
}

const stateHandlers: stateMachine = {
    [q.QuizStateEnum.LOBBY]: {
        'player:join': (io, socket, data) => {
            socket.emit("player:joined", { playerId: data.playerId });
        },
        'quiz:start': (io, socket, data) => {
            io.emit("quiz:started", data);
        },
    },
    [q.QuizStateEnum.PREQUESTION_COUNTDOWN]: {},
    [q.QuizStateEnum.QUESTION_REVEALED]: {},
    [q.QuizStateEnum.QUESTION_ANSWERING]: {},
    [q.QuizStateEnum.ANSWER_REVEALED]: {},
    [q.QuizStateEnum.LEADERBOARD]: {},
    [q.QuizStateEnum.FINISHED]: {},
}

io.on("connection", (socket) => {
    socket.data.state = q.QuizStateEnum.LOBBY;

    socket.onAny((eventName, data) => {
        const currentState: q.QuizStateEnumType = socket.data.state;
        const stateLogic = stateHandlers[currentState as q.QuizStateEnumType];

        if (stateLogic && stateLogic[eventName]) {
            stateLogic[eventName](io, socket, data);
        } else {
            console.warn(`No handler for event ${eventName} in state ${currentState}`);
            socket.emit("error", `Event ${eventName} not allowed in state ${currentState}`);
        }
    })
});

httpServer.listen(3001, () => {
    console.log("listening on *:3001");
});

