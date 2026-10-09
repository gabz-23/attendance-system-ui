import { Analytics } from '@vercel/analytics/next';
import type { Metadata, Viewport } from 'next';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';
import { RoleProvider } from '@/components/role-context';
import './globals.css';

export const metadata: Metadata = {
    title: 'Sistema de asistencias por código QR',
    description:
        'Registra y gestiona la asistencia de tus clases con códigos QR. Plataforma para profesores y estudiantes.',
    generator: 'v0.app',
    icons: {
        icon: [{ url: '/icon-light-32x32.png' }, { url: '/icon.svg', type: 'image/svg+xml' }],
        apple: '/apple-icon.png',
    },
};

export const viewport: Viewport = {
    colorScheme: 'light',
    themeColor: 'white',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable} bg-background`}>
            <body className="font-sans antialiased">
                <RoleProvider>{children}</RoleProvider>
                {process.env.NODE_ENV === 'production' && <Analytics />}
            </body>
        </html>
    );
}
