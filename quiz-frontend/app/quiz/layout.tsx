import { SocketProvider } from '@/context/socketprovider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
        <SocketProvider>
          {children}
        </SocketProvider>
  );
}