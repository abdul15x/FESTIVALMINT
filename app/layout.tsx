import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import { MotionProvider } from '@/components/motion/primitives';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  weight: ['400', '500', '600'],
  subsets: ['latin'],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  weight: ['500', '600', '700'],
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  weight: ['400', '500', '600'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FESTIVALMINT AI: University Event Sponsorship Marketplace',
  description:
    'University sponsorship marketplace connecting student societies and events with relevant brand sponsors, from structured package tiers and match insights to PayPal Sandbox checkout and verified fulfillment reports.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f7f6f2] text-[#0c121e] selection:bg-emerald-100 selection:text-emerald-950">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
