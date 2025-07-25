import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ReduxProvider from '@/app/components/providers/ReduxProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Recruitment Platform',
  description: 'A comprehensive platform for recruitment and hiring',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}