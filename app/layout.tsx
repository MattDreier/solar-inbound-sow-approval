import type { Metadata } from 'next';
import { Figtree, Hedvig_Letters_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['500'],
  variable: '--font-figtree',
});

const hedvigLettersSans = Hedvig_Letters_Sans({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-hedvig',
});

export const metadata: Metadata = {
  title: 'Solar SOW Approval System',
  description: 'Scope of Work approval system for solar installations',
  icons: {
    icon: '/sunvena-favicon.png',
    apple: '/sunvena-favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${figtree.variable} ${figtree.className} ${hedvigLettersSans.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
