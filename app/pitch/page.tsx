import Link from 'next/link';
import { ArrowLeft, Download, Film, Sparkles, CheckCircle2 } from 'lucide-react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { buttonClasses } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Product Pitch & Demonstration — FESTIVALMINT AI',
  description:
    'Official startup pitch and demonstration video for FESTIVALMINT AI, built for the PayPal AI Hackathon.',
};

export default function PitchVideoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f6f2] text-[#0c121e]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href="/" className={buttonClasses('outline', 'sm')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Marketplace
          </Link>
        </div>

        <div className="mb-8">
          <Badge variant="mint" dot className="mb-3">
            PayPal AI Hackathon 2026 Submission
          </Badge>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#0c121e] sm:text-4xl">
            FESTIVALMINT AI Product Pitch &amp; Demonstration
          </h1>
          <p className="mt-2 text-base text-stone-600 max-w-3xl leading-relaxed">
            A comprehensive overview of the campus sponsorship challenge, our Gemini-powered intelligent matchmaking, dynamic package design, and server-verified PayPal Sandbox settlement.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Main 16:9 Pitch Video */}
          <div className="lg:col-span-8 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-stone-300/90 bg-[#0c121e] shadow-xl">
              <video
                controls
                preload="metadata"
                className="w-full aspect-video bg-black"
                src="/video/festivalmint-pitch-demo-1080p.mp4"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-display text-base font-bold text-[#0c121e]">
                    Version A — Master Pitch Video (16:9)
                  </h3>
                  <Badge variant="mint">1080p · 2:09</Badge>
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Full 8-scene startup pitch with founder narration, real live UI footage, PayPal Sandbox checkout, and burned-in subtitles.
                </p>
              </div>
              <a
                href="/video/festivalmint-pitch-demo-1080p.mp4"
                download="festivalmint-pitch-demo-1080p.mp4"
                className={buttonClasses('primary', 'sm')}
              >
                <Download className="h-3.5 w-3.5" />
                Download MP4 (14.2 MB)
              </a>
            </div>

            {/* Video Chapters */}
            <div className="rounded-2xl border border-stone-200/90 bg-white p-6 shadow-xs space-y-4">
              <h4 className="font-display text-sm font-bold uppercase tracking-wider text-stone-500">
                Video Storyboard &amp; Chapters
              </h4>
              <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-stone-200/80 bg-[#faf9f6] p-3">
                  <span className="font-mono font-bold text-emerald-700">0:00 – 0:14</span>
                  <p className="mt-1 font-semibold text-stone-900">Scene 1: The Hook</p>
                  <p className="text-stone-500">The campus sponsorship dilemma.</p>
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-[#faf9f6] p-3">
                  <span className="font-mono font-bold text-emerald-700">0:14 – 0:35</span>
                  <p className="mt-1 font-semibold text-stone-900">Scene 2: The Problem</p>
                  <p className="text-stone-500">Spreadsheet chaos, cold emails &amp; lost deals.</p>
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-[#faf9f6] p-3">
                  <span className="font-mono font-bold text-emerald-700">0:35 – 0:45</span>
                  <p className="mt-1 font-semibold text-stone-900">Scene 3: Meet FESTIVALMINT</p>
                  <p className="text-stone-500">Brand reveal &amp; live marketplace showcase.</p>
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-[#faf9f6] p-3">
                  <span className="font-mono font-bold text-emerald-700">0:45 – 1:07</span>
                  <p className="mt-1 font-semibold text-stone-900">Scene 4: Organizer Studio</p>
                  <p className="text-stone-500">Event setup &amp; dynamic packages studio.</p>
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-[#faf9f6] p-3">
                  <span className="font-mono font-bold text-emerald-700">1:07 – 1:27</span>
                  <p className="mt-1 font-semibold text-stone-900">Scene 5: AI Matching Radar</p>
                  <p className="text-stone-500">6-factor scoring &amp; Gemini outreach drafts.</p>
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-[#faf9f6] p-3">
                  <span className="font-mono font-bold text-emerald-700">1:27 – 1:43</span>
                  <p className="mt-1 font-semibold text-stone-900">Scene 6: PayPal Sandbox Settlement</p>
                  <p className="text-stone-500">Package selection &amp; $500 captured payment.</p>
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-[#faf9f6] p-3">
                  <span className="font-mono font-bold text-emerald-700">1:43 – 1:52</span>
                  <p className="mt-1 font-semibold text-stone-900">Scene 7: Proof &amp; Deliverables</p>
                  <p className="text-stone-500">Audit-ready proof ledger &amp; ROI reporting.</p>
                </div>
                <div className="rounded-xl border border-stone-200/80 bg-[#faf9f6] p-3">
                  <span className="font-mono font-bold text-emerald-700">1:52 – 2:09</span>
                  <p className="mt-1 font-semibold text-stone-900">Scene 8: Tech Stack &amp; Closing</p>
                  <p className="text-stone-500">Gemini, PayPal Platform, APIMatic, Next.js, Supabase.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Cut (9:16 Vertical) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="overflow-hidden rounded-2xl border border-stone-300/90 bg-[#0c121e] shadow-xl">
              <video
                controls
                preload="metadata"
                className="w-full aspect-[9/16] bg-black max-h-[640px] mx-auto object-contain"
                src="/video/festivalmint-pitch-social-9x16.mp4"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="rounded-2xl border border-stone-200/90 bg-white p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-bold text-[#0c121e]">
                  Version B — Social Cut (9:16)
                </h3>
                <Badge variant="blue">Reels / Shorts</Badge>
              </div>
              <p className="text-xs text-stone-500 leading-relaxed">
                Reframed vertical format with bold mobile subtitles, ideal for Instagram Reels, YouTube Shorts, and TikTok (51 seconds).
              </p>
              <a
                href="/video/festivalmint-pitch-social-9x16.mp4"
                download="festivalmint-pitch-social-9x16.mp4"
                className={buttonClasses('outline', 'sm', 'w-full')}
              >
                <Download className="h-3.5 w-3.5" />
                Download 9:16 MP4 (2.7 MB)
              </a>
            </div>

            {/* Highlights */}
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/40 p-5 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                <Sparkles className="h-4 w-4" />
                Pitch Highlights
              </div>
              <ul className="space-y-2 text-xs text-stone-700">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                  <span>Real live application footage — zero fake UI</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                  <span>Natural founder voiceover with synchronized subtitles</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                  <span>Verified PayPal Sandbox $500 capture transaction</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                  <span>APIMatic &amp; PayPal Developer Platform highlighted</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

