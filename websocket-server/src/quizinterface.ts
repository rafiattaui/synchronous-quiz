export interface Player {
    userId: string;
    isOnline: boolean;
    name: string;
    score: number;
    selectedAnswer: number | null; // index of the selected answer, or null if not answered yet
    answerTime: number | null; // timestamp in ms when the player submitted their answer, or null if not answered yet
}

export interface Question {
    questionId: string;
    question: string;
    options: string[];
    correctAnswer: number;
}

export const QuizStateEnum = {
    LOBBY: "LOBBY",
    PREQUESTION_COUNTDOWN: "PREQUESTION_COUNTDOWN",
    QUESTION_REVEALED: "QUESTION_REVEALED",
    QUESTION_ANSWERING: "QUESTION_ANSWERING",
    ANSWER_REVEALED: "ANSWER_REVEALED",
    LEADERBOARD: "LEADERBOARD",
    FINISHED: "FINISHED",
} as const;

export type QuizStateEnumType = (typeof QuizStateEnum)[keyof typeof QuizStateEnum];

export interface QuizState {
    quizId: string;
    players: Record<string, Player>; // userId -> Player
    socketIdToUserId: Record<string, string>; // wsId -> userId
    currentQuestion: Omit<Question, "correctAnswer"> | null;
    state: QuizStateEnumType;
    phaseEndsAt: number | null; // timestamp in ms when the current phase ends for countdowns,
    //  or null if not applicable
}

