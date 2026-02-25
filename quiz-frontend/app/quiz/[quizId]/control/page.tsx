'use client';

import { useSocket } from '@/context/socketprovider';
import { use, useEffect, useState } from 'react';
import { Alert } from '@mantine/core';
import LobbyView from '@/components/LobbyView';
import { AdminGrid } from '@/components/AdminGrid';
import AdminView from '@/components/AdminView';

export default function QuizControlPanel({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const { socket } = useSocket();
  const [state, setState] = useState<string>('');
  // for testing purposes, hardcode user id to 1 which is default host in sample quiz state.
  const [userId, setUserId] = useState('1');
  const [players, setPlayers] = useState<any[]>([]);
  const [status, setStatus] = useState('Checking...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      setStatus('Connected');
      console.log('Connected:', socket.id);
      socket.emit('player:join', {
        name: `Admin`,
        userId: userId,
        quizId: quizId,
      });
    };

    const onDisconnect = () => {
      setStatus('Offline');
    };

    const onJoinConfirm = (data: { name: string }) => {
      console.log(`Server confirmed join for: ${data.name}`);
    };

    const onRoomUpdate = (data: { players: any[] }) => {
      console.log('Received players:', data.players);
      setPlayers(data.players); // This makes the JSON.stringify work!
    };

    const onStateUpdate = (data: { state: string }) => {
      console.log('Quiz state updated:', data.state);
      setState(data.state);
    };

    // Listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('player:joined', onJoinConfirm);
    socket.on('room:update', onRoomUpdate);
    socket.on('state:update', onStateUpdate);
    socket.on('error', (msg) => setError(msg));
    socket.on('debug', (msg) => console.log('Server Debug Message:', msg));

    // Set initial state
    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('player:joined', onJoinConfirm);
      socket.off('room:update', onRoomUpdate);
      socket.off('state:update', onStateUpdate);
      socket.off('error');
    };
  }, [socket, userId]);

  // control panel functions for testing
  const nextState = () => {
    console.log('Advancing to next state...');
    socket?.emit('state:next', { quizId: quizId });
  };

  const pongServer = () => {
    console.log('Pinging...');
    socket?.emit('pong', { time: Date.now(), quizId: quizId });
  };

  return (
    /* Added relative and z-50 to ensure clickability */
    <>
      {error && (
        <Alert variant="filled" color="red">
          {JSON.stringify(error)}
        </Alert>
      )}

      <main>
        <AdminView
          state={state}
          status={status}
          quizId={quizId}
          players={players}
          pongServer={pongServer}
          isAdmin={true}
        />
        <AdminGrid nextState={nextState} />
      </main>
    </>
  );
}
