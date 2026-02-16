import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Padel Rounds',
  description: 'Gestiona tus partidas de padel en tiempo real.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
