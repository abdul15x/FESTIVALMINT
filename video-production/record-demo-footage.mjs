import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const pwRequire = createRequire(
  'C:\\Users\\MOUEED\\.gemini\\antigravity\\brain\\f2d05ae1-21fd-41ad-b7dc-a3771b6d9f41\\scratch\\pw-qa\\package.json'
);
const { chromium } = pwRequire('playwright-core');

const CHROME_PATH = fs.existsSync('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe')
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const BASE_URL = 'http://127.0.0.1:3002';
const DEMO_PW = 'DemoMint!2026';
const ASSETS_DIR = path.resolve('video-production', 'assets');
const RECORDINGS_DIR = path.resolve('video-production', 'recordings');
const AUDIO_DIR = path.resolve('video-production', 'audio');

fs.mkdirSync(RECORDINGS_DIR, { recursive: true });

const durations = JSON.parse(fs.readFileSync(path.join(AUDIO_DIR, 'durations.json'), 'utf8'));

async function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function recordScene(browser, sceneId, targetDurationSec, runner) {
  console.log(`\n=== RECORDING ${sceneId.toUpperCase()} (Target: ${targetDurationSec.toFixed(2)}s) ===`);
  const tempDir = path.join(RECORDINGS_DIR, `temp_${sceneId}`);
  fs.mkdirSync(tempDir, { recursive: true });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: tempDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();
  const startTime = Date.now();

  try {
    await runner(page);
  } catch (err) {
    console.error(`Error in ${sceneId}:`, err);
  }

  // Ensure we meet the audio target duration
  const elapsed = (Date.now() - startTime) / 1000;
  if (elapsed < targetDurationSec + 0.5) {
    const remainMs = Math.round((targetDurationSec + 0.5 - elapsed) * 1000);
    console.log(`Holding ${sceneId} for additional ${remainMs}ms to match narration...`);
    await delay(remainMs);
  }

  const videoObj = page.video();
  await page.close();
  await context.close();

  if (videoObj) {
    const origPath = await videoObj.path();
    const destPath = path.join(RECORDINGS_DIR, `${sceneId}.webm`);
    if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
    fs.copyFileSync(origPath, destPath);
    console.log(`Saved: ${destPath}`);
  }
}

async function main() {
  console.log('Launching browser with recording capabilities...');
  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--enable-features=NetworkService,NetworkServiceInProcess', '--no-sandbox'],
  });

  try {
    // SCENE 1: The Hook (Motion graphic)
    await recordScene(browser, 'scene1', durations.scene1, async (page) => {
      const fileUrl = 'file:///' + path.join(ASSETS_DIR, 'scene1_hook.html').replace(/\\/g, '/');
      await page.goto(fileUrl, { waitUntil: 'networkidle' });
      await delay(14000);
    });

    // SCENE 2: The Problem (4 pain points)
    await recordScene(browser, 'scene2', durations.scene2, async (page) => {
      const fileUrl = 'file:///' + path.join(ASSETS_DIR, 'scene2_problem.html').replace(/\\/g, '/');
      await page.goto(fileUrl, { waitUntil: 'networkidle' });
      await delay(20500);
    });

    // SCENE 3: Logo Reveal + Real Landing Page Interactive Ledger
    await recordScene(browser, 'scene3', durations.scene3, async (page) => {
      const fileUrl = 'file:///' + path.join(ASSETS_DIR, 'scene3_reveal.html').replace(/\\/g, '/');
      await page.goto(fileUrl, { waitUntil: 'networkidle' });
      await delay(3500);

      // Navigate to live landing page
      await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
      await delay(1200);

      // Smooth scroll down to interactive showcase
      await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }));
      await delay(1500);

      // Click Bronze tier
      const bronzeBtn = page.locator('button:has-text("Bronze")').first();
      if (await bronzeBtn.isVisible()) {
        await bronzeBtn.click();
        await delay(1200);
      }

      // Click Gold tier
      const goldBtn = page.locator('button:has-text("Gold")').first();
      if (await goldBtn.isVisible()) {
        await goldBtn.click();
        await delay(1500);
      }
    });

    // SCENE 4: Organizer Dashboard & Dynamic Packages Studio
    await recordScene(browser, 'scene4', durations.scene4, async (page) => {
      // Sign in as organizer
      await page.goto(`${BASE_URL}/auth/sign-in`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', 'organizer.demo@festivalmint.local');
      await page.fill('input[type="password"]', DEMO_PW);
      await Promise.all([
        page.waitForURL((u) => !u.pathname.startsWith('/auth/')),
        page.click('button[type="submit"]'),
      ]);
      await delay(1500);

      // Organizer dashboard overview
      await page.goto(`${BASE_URL}/organizer/dashboard`, { waitUntil: 'networkidle' });
      await delay(2500);

      // Navigate to event management
      await page.goto(`${BASE_URL}/organizer/events/33333333-3333-4333-8333-333333333301`, {
        waitUntil: 'networkidle',
      });
      await delay(2000);

      // Smooth scroll to Package Studio
      await page.evaluate(() => window.scrollBy({ top: 520, behavior: 'smooth' }));
      await delay(4000);

      // Highlight custom package fields
      const priceInput = page.locator('input[type="number"]').first();
      if (await priceInput.isVisible()) {
        await priceInput.focus();
        await delay(2000);
      }
      await delay(5000);
    });

    // SCENE 5: AI-Powered Matching & Outreach Drafts
    await recordScene(browser, 'scene5', durations.scene5, async (page) => {
      await page.goto(`${BASE_URL}/auth/sign-in`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', 'organizer.demo@festivalmint.local');
      await page.fill('input[type="password"]', DEMO_PW);
      await Promise.all([
        page.waitForURL((u) => !u.pathname.startsWith('/auth/')),
        page.click('button[type="submit"]'),
      ]);

      await page.goto(
        `${BASE_URL}/organizer/matches?eventId=33333333-3333-4333-8333-333333333301`,
        { waitUntil: 'networkidle' }
      );
      await delay(2500);

      // Click Rank & Explain Sponsors
      const rankBtn = page.locator('button:has-text("Rank & Explain Sponsors")');
      if (await rankBtn.isVisible()) {
        await rankBtn.click();
        await delay(4000);
      }

      // Scroll to view match cards
      await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
      await delay(3000);

      // Click generate outreach pitch
      const pitchBtn = page.locator('button:has-text("Tailored Pitch")').first();
      if (await pitchBtn.isVisible()) {
        await pitchBtn.click();
        await delay(4500);
      }
      await delay(3000);
    });

    // SCENE 6: Sponsor Experience, Package Selection & PayPal Sandbox Checkout
    await recordScene(browser, 'scene6', durations.scene6, async (page) => {
      // Sign in as sponsor
      await page.goto(`${BASE_URL}/auth/sign-in`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', 'sponsor.demo@festivalmint.local');
      await page.fill('input[type="password"]', DEMO_PW);
      await Promise.all([
        page.waitForURL((u) => !u.pathname.startsWith('/auth/')),
        page.click('button[type="submit"]'),
      ]);
      await delay(1200);

      // Sponsor Discover page
      await page.goto(`${BASE_URL}/sponsor/discover`, { waitUntil: 'networkidle' });
      await delay(2500);

      // Open BuildFest Hackathon event
      await page.goto(`${BASE_URL}/sponsor/events/33333333-3333-4333-8333-333333333301`, {
        waitUntil: 'networkidle',
      });
      await delay(2500);

      // Scroll to package tiers
      await page.evaluate(() => window.scrollBy({ top: 480, behavior: 'smooth' }));
      await delay(2500);

      // Show verified PayPal Sandbox payment receipt
      await page.goto(`${BASE_URL}/sponsor/payments/42073179-e244-4fde-866d-6c1216e65485`, {
        waitUntil: 'networkidle',
      });
      await delay(4500);
    });

    // SCENE 7: Deliverables Tracking & Performance ROI Report
    await recordScene(browser, 'scene7', durations.scene7, async (page) => {
      await page.goto(`${BASE_URL}/auth/sign-in`, { waitUntil: 'networkidle' });
      await page.fill('input[type="email"]', 'sponsor.demo@festivalmint.local');
      await page.fill('input[type="password"]', DEMO_PW);
      await Promise.all([
        page.waitForURL((u) => !u.pathname.startsWith('/auth/')),
        page.click('button[type="submit"]'),
      ]);

      await page.goto(`${BASE_URL}/sponsor/reports/42073179-e244-4fde-866d-6c1216e65485`, {
        waitUntil: 'networkidle',
      });
      await delay(2500);

      // Scroll down to view deliverables proof and audit trail
      await page.evaluate(() => window.scrollBy({ top: 380, behavior: 'smooth' }));
      await delay(4000);
      await page.evaluate(() => window.scrollBy({ top: 300, behavior: 'smooth' }));
      await delay(2500);
    });

    // SCENE 8: Technology Ecosystem & Grand Closing
    await recordScene(browser, 'scene8', durations.scene8, async (page) => {
      const fileUrl = 'file:///' + path.join(ASSETS_DIR, 'scene8_tech.html').replace(/\\/g, '/');
      await page.goto(fileUrl, { waitUntil: 'networkidle' });
      await delay(16500);
    });

    console.log('\n=== ALL 8 SCENES RECORDED SUCCESSFULLY! ===');
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

