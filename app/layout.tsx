import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Padel Rounds Queue',
  description: 'Real-time Padel queue manager',
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
