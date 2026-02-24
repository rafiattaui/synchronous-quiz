'use client'

import { useSocket } from '@/context/socketprovider';
import { useEffect, useState, use } from 'react';
import { Alert } from '@mantine/core';
import LobbyView from '@/components/LobbyView';

export default function QuizRoom({ params }: { params: Promise<{ quizId: string }>}) {
    const { quizId } = use(params);
    const { socket } = useSocket();
    const [state, setState] = useState("")
    const [userId, setUserId] = useState(() => Math.floor(Math.random() * 1000).toString());
    const [players, setPlayers] = useState<any[]>([]);
    const [status, setStatus] = useState('Checking...');
    const [error, setError] = useState<string|null>(null);
    const [question, setQuestion] = useState<string>("");
    const [answers, setAnswers] = useState<string[]>([]);


    useEffect(() => {
        if (!socket) return;

        const onConnect = () => {
            setStatus('Connected');
            console.log("Connected:", socket.id);
            socket.emit('player:join', { name: `player${userId}`, userId: userId, quizId: quizId});
        };

        const onDisconnect = () => {
            setStatus('Offline');
        };

        const onJoinConfirm = (data: { name: string }) => {
            console.log(`Server confirmed join for: ${data.name}`);
        };

        const onRoomUpdate = (data: { players: any[] }) => {
            console.log("Received players:", data.players);
            setPlayers(data.players); // This makes the JSON.stringify work!
        };

        const onStateUpdate = (data: { state: string }) => {
            console.log("Quiz state updated:", data.state);
            setState(data.state);
        }

        // Listeners
        socket.on("connect", onConnect);
        socket.on("disconnect", onDisconnect);
        socket.on("player:joined", onJoinConfirm);
        socket.on("room:update", onRoomUpdate);
        socket.on("state:update", onStateUpdate);
        socket.on("error",  (msg) => setError(msg));
        socket.on("debug", (msg) => console.log("Server Debug Message:", msg))

        // Set initial state
        if (socket.connected) onConnect();

        return () => {
            socket.off("connect", onConnect);
            socket.off("disconnect", onDisconnect);
            socket.off("player:joined", onJoinConfirm);
            socket.off("room:update");
            socket.off("error");
        };
    }, [socket, userId]);

    // Test functions
    const pongServer = () => {
        console.log("Pinging...");
        socket?.emit('pong', { time: Date.now(), quizId: quizId });
    };

    const renderContent = () => {
        switch (state) {
            case 'LOBBY':
                return <LobbyView state={state} status={status} quizId={quizId} players={players} pongServer={pongServer} />;
            case 'PREQUESTION_COUNTDOWN':
            // TODO -  return <CountdownView quizId={quizId} />;
            default:
                return <div>Loading...</div>
        }
    }

    return (
        /* Added relative and z-50 to ensure clickability */
        <>
        {error && (
            <Alert
            variant='filled'
            color="red"
            >
                {error}
            </Alert>
        )}

        <main>
            {renderContent()}
        </main>
        </>
    );
}