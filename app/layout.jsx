import { Inter } from 'next/font/google';

import './globals.css';
import { Navbar } from '@/components/navbar';
import { SessionProvider } from '@/components/session-provider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'AI Help Center',
  description: 'Production-ready AI help center powered by Next.js, Tailwind CSS, and Gemini with RAG.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} min-h-screen bg-slate-950 antialiased`}>
        <SessionProvider>
          <Navbar />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
