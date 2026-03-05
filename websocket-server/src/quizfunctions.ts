import { Server, Socket } from 'socket.io';
import type { EventPayload } from './quizpayloads.ts';
import * as qi from './quizinterface.ts';

const QUIZ_STATE_TRANSITIONS: Record<
  qi.QuizStateEnumType,
  qi.QuizStateEnumType
> = {
  [qi.QuizStateEnum.LOBBY]: qi.QuizStateEnum.PREQUESTION_COUNTDOWN,
  [qi.QuizStateEnum.PREQUESTION_COUNTDOWN]: qi.QuizStateEnum.QUESTION_ANSWERING,
  [qi.QuizStateEnum.QUESTION_ANSWERING]: qi.QuizStateEnum.ANSWER_REVEALED,
  [qi.QuizStateEnum.ANSWER_REVEALED]: qi.QuizStateEnum.LEADERBOARD,
  [qi.QuizStateEnum.QUESTION_REVEALED]: qi.QuizStateEnum.LEADERBOARD,
  [qi.QuizStateEnum.LEADERBOARD]: qi.QuizStateEnum.FINISHED,
  [qi.QuizStateEnum.FINISHED]: qi.QuizStateEnum.LOBBY, // Loop back to lobby after finished
  // consider calling functions to validate the state change first and then actually change state?
};

/**
 * Handle a player joining the lobby
 */
export const handlePlayerJoin = async (
  io: Server,
  socket: Socket,
  data: EventPayload<'player:join'>,
  QuizState: qi.QuizState
) => {
  const { userId, name } = data;
  // currently allows user joining at any state.
  // TODO - Check state and only allow joining in the lobby state.
  // TODO - Consider allowing rejoining if disconnected in non-lobby states.
  // Join the Socket.io room immediately
  socket.join(QuizState.quizId);

  // Update or Create player
  if (!QuizState.players[userId]) {
    QuizState.players[userId] = {
      userId,
      name,
      isConnected: true,
      score: 0,
      selectedAnswer: null,
      answerTime: null,
    };
    console.log(`[LOBBY] ${name} created.`);
  } else {
    QuizState.players[userId].isConnected = true;
    console.log(`[LOBBY] ${name} rejoined.`);
  }

  // Always map the CURRENT socket to this user
  QuizState.socketIdToUserId[socket.id] = userId;

  syncState(io, QuizState);
  roomUpdate(QuizState, io);
};

/**
 * Handle a pong/heartbeat
 */
export const handlePong = (
  io: Server,
  socket: Socket,
  data: any,
  state: qi.QuizState
) => {
  console.log(`[PONG] ${socket.id} ponged!`);
};

/**
 * Handle a player disconnecting
 */

export const handlePlayerDisconnect = (
  io: Server,
  socket: Socket,
  data: { reason?: string },
  QuizState: qi.QuizState
) => {
  const userId = QuizState.socketIdToUserId[socket.id];

  if (userId && QuizState.players[userId]) {
    // Only mark disconnected if the CURRENT socket matches the one we have on file
    // This prevents a 'rejoin' from being immediately overwritten by an old 'disconnect'
    QuizState.players[userId].isConnected = false;
    delete QuizState.socketIdToUserId[socket.id];

    console.log(`[DISCONNECT] User ${userId} went offline.`);
  }

  roomUpdate(QuizState, io);
};

export const handleNextState = (
  io: Server,
  socket: Socket,
  data: any,
  QuizState: qi.QuizState
) => {
  const userId = QuizState.socketIdToUserId[socket.id];
  const isAdmin = userId === QuizState.hostUserId;
  if (!isAdmin) {
    socket.emit('error', { err: 'Only the host can advance the quiz state.' });
    return;
  } // TODO - Only allow manual transitions on specific states.
  const currentState = QuizState.state;
  const nextState = QUIZ_STATE_TRANSITIONS[currentState];
  if (nextState) {
    QuizState.state = nextState;
    syncState(io, QuizState);
  } else {
    socket.emit('error', { err: 'Invalid state transition attempted.' });
  }
};

// These functions should only be called by the state handlers,
// as they assume the quiz state has already been validated and modified accordingly.
// They emit updates to all clients in the quiz room based on the current quiz state.

const roomUpdate = (QuizState: qi.QuizState, io: Server) => {
  const playerNames = Object.values(QuizState.players)
    .filter((player) => player.isConnected === true)
    .map((player) => player.name);
  io.to(QuizState.quizId).emit('room:update', { players: playerNames });
};

const syncState = (io: Server, QuizState: qi.QuizState) => {
  io.to(QuizState.quizId).emit('state:update', { state: QuizState.state });
};
