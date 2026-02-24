'use client'

import { useSocket } from "@/context/socketprovider";
import { use, useEffect, useState } from "react"
import { Alert } from "@mantine/core";

export default function QuizControlPanel({ params }: { params: Promise<{ quizId: string }>}){
    const { quizId } = use(params);
    const { socket } = useSocket();
    const [state, setState] = useState<string>("");
    // for testing purposes, hardcode user id to 1 which is default host in sample quiz state.
    const [userId, setUserId] = useState("1");
    const [players, setPlayers] = useState<any[]>([]);
    const [status, setStatus] = useState('Checking...');
    const [error, setError] = useState<string|null>(null);

    useEffect(() => {
        if (!socket) return;

        const onConnect = () => {
            setStatus('Connected');
            console.log("Connected:", socket.id);
            socket.emit('player:join', { name: `Admin`, userId: userId, quizId: quizId});
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
            socket.off("room:update", onRoomUpdate);
            socket.off("state:update", onStateUpdate);
            socket.off("error");
        };
    }, [socket, userId]);

    // control panel functions for testing
    const nextState = () => {
        console.log("Advancing to next state...");
        socket?.emit('state:next', { quizId: quizId });
    };

    return (
            /* Added relative and z-50 to ensure clickability */
            <>
            {error && (
                <Alert
                variant='filled'
                color="red"
                >
                    {JSON.stringify(error)}
                </Alert>
            )}
    
            <main>
            <div className="relative z-50 p-6 max-w-2xl mx-auto space-y-6 bg-white shadow-lg rounded-xl border mt-10">
                <h1 className="text-2xl font-bold border-b pb-2">Quiz Debugger (Control Panel)</h1>
                
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${status === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <p className="font-mono font-medium">Status: {status}</p>
                </div>
                <p className='font-mono font-medium'>Quiz ID: {quizId}</p>
                <p className="font-mono font-medium">Quiz State: {state}</p>

                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all active:scale-95 shadow-sm"
                    onClick={nextState}
                >
                    Next State
                </button>
            </div>
    
                <div className="mt-6">
                    <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Debug Log (Players)</h2>
                    <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg mt-2 overflow-x-auto text-xs leading-relaxed">
                        {players.length > 0 ? JSON.stringify(players, null, 2) : "// No players in state"}
                    </pre>
                </div>
            </div>
            </main>
            </>
        );  
}

