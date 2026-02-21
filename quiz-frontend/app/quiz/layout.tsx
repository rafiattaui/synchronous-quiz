import { SocketProvider } from '@/context/socketprovider';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { MantineProvider, ColorSchemeScript, Alert } from '@mantine/core';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript suppressHydrationWarning/>
      </head>
      <body>
        <MantineProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </MantineProvider>
      </body>
    </html>
  );
}