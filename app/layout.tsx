import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'FESTIVALMINT AI — Great University Events Deserve the Right Sponsors',
  description:
    'AI-powered university sponsorship marketplace connecting student societies and events with relevant sponsors—from package generation and explainable matching to PayPal Sandbox checkout and fulfillment reporting.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-[#0b1220] selection:bg-emerald-100 selection:text-emerald-950">
        {children}
      </body>
    </html>
  );
}
