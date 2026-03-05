// context/SocketProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '@/lib/socket';

const SocketContext = createContext({
  isConnected: false,
  socket: socket,
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.connect(); // Manually trigger connection

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.disconnect();
    };
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <SocketContext.Provider value={{ isConnected, socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
