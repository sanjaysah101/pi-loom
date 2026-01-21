import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

import { Suspense } from 'react';

import Provider from '../components/provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PI Loom',
  description:
    'Pi Loom is an AI-powered music composer that transforms the digits of π into harmonious musical patterns',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense
          fallback={
            <div className="text-center text-2xl font-bold text-primary">
              Loading...
            </div>
          }
        >
          <Provider>{children}</Provider>
        </Suspense>
      </body>
    </html>
  );
}
