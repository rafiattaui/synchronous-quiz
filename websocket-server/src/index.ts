import { Server, Socket } from "socket.io";
import express from "express";
import type { Express } from "express";
import { createServer } from "http";
import { SAMPLE_QUESTIONS } from "./sampledata.ts";
import * as qi from "./quizinterface.ts";
import type { EventPayload, QuizEvents } from "./quizpayloads.ts";
import { QuizSchemas } from "./quizpayloads.ts";
import * as z from "zod";
import * as h from "./quizfunctions.ts"

type SocketHandler<T extends keyof QuizEvents> = (
    io: Server, 
    socket: Socket, 
    data: EventPayload<T>,
    state: qi.QuizState,
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

/*
* For storing multiple quiz states, to allow for multiple quiz sessions.
* Consider swapping to Redis for this functionality.
*/
const activeQuizStates = new Map<string, qi.QuizState>();

const sampleQuizState: qi.QuizState = {
    quizId: '1',
    players: {},
    socketIdToUserId: {},
    currentQuestion: null,
    questions: [],
    state: qi.QuizStateEnum.LOBBY,
    phaseEndsAt: null,
}

activeQuizStates.set('1', sampleQuizState)

/*
* Stores valid quiz messages, and maps them to their function.
*/
const stateHandlers: StateMachine = {
    [qi.QuizStateEnum.LOBBY]: {
        'player:join': (io, socket, data, quizState) => h.handlePlayerJoin(io, socket, data, quizState),
        'disconnect': (io, socket, data, quizState) => h.handlePlayerDisconnect(io, socket, data, quizState),
    },
    [qi.QuizStateEnum.QUESTION_ANSWERING]: {},
    [qi.QuizStateEnum.PREQUESTION_COUNTDOWN]: {},
    [qi.QuizStateEnum.QUESTION_REVEALED]: {},
    [qi.QuizStateEnum.ANSWER_REVEALED]: {},
    [qi.QuizStateEnum.LEADERBOARD]: {},
    [qi.QuizStateEnum.FINISHED]: {},
};

const globalHandlers: StateActions = {
    'pong': (io, socket, data, quizState) => h.handlePong(io, socket, data, quizState),
}

io.on("connection", (socket) => {
    socket.onAny((eventName, rawBuffer: any) => {

        // check if the event even exists at all
        if (!(eventName in QuizSchemas)) {
        console.warn(`Unknown Event: ${eventName}`);
        return socket.emit("error", "The event sent is not recognized by the server.");
        }

        // Every messsage sent by the client must provide a Quiz ID
        const quizId = rawBuffer?.quizId;

        if (!quizId){
            return socket.emit("error", "No Quiz ID Provided");
        }

        const currentQuiz = activeQuizStates.get(quizId);

        // check if there is currently a quiz session with that id
        if (!currentQuiz){
            console.log(`No quiz session for Quiz ID: ${quizId}.`)
            return socket.emit("error","No quiz session found for that Quiz ID.")
        }
        // check global handlers for the handler first.
        let handler = globalHandlers[eventName as keyof QuizEvents];
        // if not, check through state handlers
        if (!handler) {
            const stateLogic = stateHandlers[currentQuiz.state];
            handler = stateLogic[eventName as keyof QuizEvents];
        }
        // once a handler is found
        if (handler) {
            const schema = QuizSchemas[eventName as keyof typeof QuizSchemas];
            const result = schema.safeParse(rawBuffer);

            if (!result.success){
                console.log(z.flattenError(result.error as z.ZodError));
                socket.emit("error", result.error)
            } else {
                (handler as SocketHandler<any>)(io, socket, result.data, currentQuiz)
            }

        } else { // if a handler isn't found
            console.warn(`No handler for event ${eventName} in state ${currentQuiz.state}`);
            socket.emit("error", `Event ${eventName} not allowed in state ${currentQuiz.state}`);
        }
    });


    // disconnect events are seperate from onAny, thus they have to be declared seperately.
    socket.on("disconnect", (reason) =>{
        const discQuizState = Array.from(activeQuizStates.values()).find(session => 
            session.socketIdToUserId.hasOwnProperty(socket.id))
        
        if (!discQuizState){
            console.warn(`Unknown WebSocket ${socket.id} tried to disconnect from session.`)
            socket.emit("error", "Player not found in any active Quiz Sessions.")
        } else {
        h.handlePlayerDisconnect(io, socket, {reason}, discQuizState)
        }
    });
});

httpServer.listen(3001, () => {
    console.log("listening on *:3001");
});

