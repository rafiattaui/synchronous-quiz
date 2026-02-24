import { Server, Socket } from "socket.io";
import type { EventPayload } from "./quizpayloads.ts";
import * as qi from "./quizinterface.ts";

const QUIZ_STATE_TRANSITIONS: Record<qi.QuizStateEnumType, qi.QuizStateEnumType> = {
    [qi.QuizStateEnum.LOBBY]: qi.QuizStateEnum.PREQUESTION_COUNTDOWN,
    [qi.QuizStateEnum.PREQUESTION_COUNTDOWN]: qi.QuizStateEnum.QUESTION_ANSWERING,
    [qi.QuizStateEnum.QUESTION_ANSWERING]: qi.QuizStateEnum.ANSWER_REVEALED,
    [qi.QuizStateEnum.ANSWER_REVEALED]: qi.QuizStateEnum.LEADERBOARD,
    [qi.QuizStateEnum.QUESTION_REVEALED]: qi.QuizStateEnum.LEADERBOARD,
    [qi.QuizStateEnum.LEADERBOARD]: qi.QuizStateEnum.FINISHED,
    [qi.QuizStateEnum.FINISHED]: qi.QuizStateEnum.LOBBY, // Loop back to lobby after finished
}

/**
 * Handle a player joining the lobby
 */
export const handlePlayerJoin = (
    io: Server, 
    socket: Socket, 
    data: EventPayload<'player:join'>,
    QuizState: qi.QuizState // Pass the state so the function can modify it
) => {
    socket.join(QuizState.quizId);
    // check if player doesn't exist in quiz state.
    if (!QuizState.players[data.userId]) {
    // 1. Create new player if they don't exist
    QuizState.socketIdToUserId[socket.id] = data.userId;
    QuizState.players[data.userId] = {
        userId: data.userId,
        name: data.name,
        isConnected: true,
        score: 0,
        selectedAnswer: null,
        answerTime: null
    };
    const playerNames = Object.values(QuizState.players).map(player=>player.name);
    console.log(`Player ${data.name} joined.`);

    } else {
        // 2. If they DO exist, change their status to isConnected
        QuizState.players[data.userId]!.isConnected = true;
        // Update the socket mapping in case they joined with a new socket ID
        QuizState.socketIdToUserId[socket.id] = data.userId; 
        console.log(`Player ${data.name} rejoined.`);
    };
    syncState(io, QuizState)
    roomUpdate(QuizState, io);
};

/**
 * Handle a pong/heartbeat
 */
export const handlePong = (io: Server, socket: Socket, data: any, state: qi.QuizState) => {
    console.log(`${socket.id} ponged!`);
};

/**
 * Handle a player disconnecting
 */

export const handlePlayerDisconnect = (
    io: Server, socket: Socket, data: any,  QuizState: qi.QuizState
) => {
    // find the player instance based on its socket.id
    const userId = QuizState.socketIdToUserId[socket.id];
    if (userId) {
        const player = QuizState.players[userId];
        if (player) {
            player.isConnected = false; // we dont delete the player instance because they may reconnect.
            delete QuizState.socketIdToUserId[socket.id];
            console.log(`${player.name} marked as disconnected!`)
        }
    } else {
        console.log(`Unknown webSocket ${socket.id} attempted to disconnect.`)
        socket.emit("error", {err: "Identity does not exist in player database."})
    }
    roomUpdate(QuizState, io);
}

export const handleNextState = (
    io: Server, socket: Socket, data: any, QuizState: qi.QuizState
) => {
    const userId = QuizState.socketIdToUserId[socket.id];
    const isAdmin = userId === QuizState.hostUserId;
    if (!isAdmin){
        socket.emit("error", {err: "Only the host can advance the quiz state."});
        return;
    }
    const currentState = QuizState.state
    const nextState = QUIZ_STATE_TRANSITIONS[currentState];
    if (nextState) {
        QuizState.state = nextState;
        syncState(io, QuizState)
    } else {
        socket.emit("error", {err: "Invalid state transition attempted."});
    }
}

// These functions should only be called by the state handlers,
// as they assume the quiz state has already been validated and modified accordingly. 
// They emit updates to all clients in the quiz room based on the current quiz state.

const roomUpdate = (QuizState: qi.QuizState, io: Server) => {
    const playerNames = Object.values(QuizState.players)
    .filter(player => player.isConnected === true)
    .map(player => player.name);
    io.to(QuizState.quizId).emit("room:update", { players: playerNames });
}

const syncState = (
    io: Server, QuizState: qi.QuizState
) => {
    io.to(QuizState.quizId).emit('state:update', {'state': QuizState.state});
}