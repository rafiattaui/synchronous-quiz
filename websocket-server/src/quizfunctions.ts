import { Server, Socket } from "socket.io";
import type { EventPayload } from "./quizpayloads.ts";
import * as qi from "./quizinterface.ts";

/**
 * Handle a player joining the lobby
 */
export const handlePlayerJoin = (
    io: Server, 
    socket: Socket, 
    data: EventPayload<'player:join'>,
    QuizState: qi.QuizState // Pass the state so the function can modify it
) => {
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
    roomUpdate(QuizState, io);
};

/**
 * Handle a pong/heartbeat
 */
export const handlePong = (io: Server, socket: Socket, data: any) => {
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
            player.isConnected = false;
            delete QuizState.socketIdToUserId[socket.id];
            console.log(`User ${userId} marked as disconnected!`)
        }
    } else {
        console.log(`Unknown webSocket ${socket.id} attempted to disconnect.`)
        socket.emit("error", {err: "Identity does not exist in player database."})
    }
    roomUpdate(QuizState, io);
}

const roomUpdate = (QuizState: qi.QuizState, io: Server) => {
    const playerNames = Object.values(QuizState.players)
    .filter(player => player.isConnected === true)
    .map(player => player.name);
    io.emit("room:update", { players: playerNames });
}