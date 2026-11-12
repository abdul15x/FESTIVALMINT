/**
 * Server-side demo account & admin seeder for FESTIVALMINT AI.
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Run with: node scripts/seed-demo.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1).trim();
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';
const demoPassword = process.env.DEMO_SEED_PASSWORD?.trim() || 'DemoMint!2026';

const isPlaceholder = (val) =>
  !val ||
  /^your[-_]|your-project-ref\.supabase\.co|your-supabase-|placeholder/i.test(val);

if (isPlaceholder(url) || isPlaceholder(serviceKey)) {
  console.error(
    'Real NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Publishable/Secret or legacy service_role) must be configured in .env.local before running seed-demo.mjs.'
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_USERS = [
  {
    email: 'organizer.demo@festivalmint.local',
    fullName: 'Amina Tariq (Demo Organizer)',
    role: 'organizer',
    linkTable: 'organizer_profiles',
    linkId: '22222222-2222-4222-8222-222222222201',
  },
  {
    email: 'sponsor.demo@festivalmint.local',
    fullName: 'Zainab Malik (Demo Sponsor)',
    role: 'sponsor',
    linkTable: 'sponsor_profiles',
    linkId: '55555555-5555-4555-8555-555555555501',
  },
  {
    email: 'admin.demo@festivalmint.local',
    fullName: 'University Moderator (Demo Admin)',
    role: 'admin',
    linkTable: null,
    linkId: null,
  },
];

async function findOrCreateAuthUser(item) {
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  const existing = listData.users.find(
    (u) => u.email?.toLowerCase() === item.email.toLowerCase()
  );
  if (existing) {
    return existing;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: item.email,
    password: demoPassword,
    email_confirm: true,
    user_metadata: {
      full_name: item.fullName,
      role: item.role === 'admin' ? 'organizer' : item.role,
    },
  });
  if (error) throw error;
  return data.user;
}

async function ensureDemoCatalogSeeded() {
  const dayMs = 86_400_000;
  const hourMs = 3_600_000;
  const now = Date.now();
  const isoOffset = (ms) => new Date(now + ms).toISOString();

  const { error: uniErr } = await supabase.from('universities').upsert(
    [
      {
        id: '11111111-1111-4111-8111-111111111101',
        name: 'Lahore Tech & Sciences University (Demo)',
        city: 'Lahore',
        country: 'Pakistan',
        website: 'https://demo-university.example.edu',
        verification_status: 'verified',
        is_demo: true,
      },
    ],
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (uniErr) throw uniErr;

  const { error: orgErr } = await supabase.from('organizer_profiles').upsert(
    [
      {
        id: '22222222-2222-4222-8222-222222222201',
        user_id: null,
        society_name: 'CampusSpark Tech Society (Demo)',
        university_id: '11111111-1111-4111-8111-111111111101',
        university_name: 'Lahore Tech & Sciences University (Demo)',
        campus_city: 'Lahore',
        category: 'Technology',
        description:
          'Student-led computer science and product engineering society running annual hackathons, AI workshops, and developer career fairs.',
        contact_person: 'Amina Tariq',
        official_email: 'campusspark.demo@example.edu',
        verification_status: 'verified',
        is_demo: true,
      },
      {
        id: '22222222-2222-4222-8222-222222222202',
        user_id: null,
        society_name: 'Civic & Arts Guild (Demo)',
        university_id: '11111111-1111-4111-8111-111111111101',
        university_name: 'Lahore Tech & Sciences University (Demo)',
        campus_city: 'Lahore',
        category: 'Cultural',
        description:
          'Inter-university performing arts, visual design showcase, and cultural festival committee.',
        contact_person: 'Bilal Hassan',
        official_email: 'civicarts.demo@example.edu',
        verification_status: 'verified',
        is_demo: true,
      },
    ],
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (orgErr) throw orgErr;

  const { error: evtErr } = await supabase.from('events').upsert(
    [
      {
        id: '33333333-3333-4333-8333-333333333301',
        organizer_id: '22222222-2222-4222-8222-222222222201',
        university_id: '11111111-1111-4111-8111-111111111101',
        title: 'BuildFest Campus AI Hackathon 2026 (Demo)',
        description:
          'A 36-hour inter-university software and AI engineering hackathon bringing together senior CS students, full-stack builders, and product designers to build real-world prototypes.',
        category: 'technology',
        city: 'Lahore',
        country: 'Pakistan',
        venue: 'Main Innovation Auditorium',
        starts_at: isoOffset(30 * dayMs),
        ends_at: isoOffset(32 * dayMs),
        expected_attendees: 450,
        audience_tags: ['Computer Science', 'AI & ML', 'Full-Stack Developers', 'Final-Year Students'],
        event_objectives: ['Developer hiring', 'API adoption', 'Brand awareness'],
        social_reach: 18500,
        sponsorship_target_minor: 450000,
        currency: 'USD',
        sponsorship_needs: ['Cash', 'Prizes', 'Software credits', 'Food'],
        status: 'published',
        is_demo: true,
      },
      {
        id: '33333333-3333-4333-8333-333333333302',
        organizer_id: '22222222-2222-4222-8222-222222222201',
        university_id: '11111111-1111-4111-8111-111111111101',
        title: 'Campus Founders & FinTech Summit (Demo)',
        description:
          'A full-day entrepreneurship and payments symposium featuring startup pitch competitions, investor panels, and student career networking booths.',
        category: 'business',
        city: 'Lahore',
        country: 'Pakistan',
        venue: 'School of Business Atrium',
        starts_at: isoOffset(45 * dayMs),
        ends_at: isoOffset(45 * dayMs + 8 * hourMs),
        expected_attendees: 300,
        audience_tags: ['Entrepreneurship', 'FinTech', 'MBA & BBA Students', 'Product Management'],
        event_objectives: ['Startup partnerships', 'Lead generation', 'Thought leadership'],
        social_reach: 12000,
        sponsorship_target_minor: 300000,
        currency: 'USD',
        sponsorship_needs: ['Cash', 'Prizes', 'Venue'],
        status: 'approved',
        is_demo: true,
      },
      {
        id: '33333333-3333-4333-8333-333333333303',
        organizer_id: '22222222-2222-4222-8222-222222222202',
        university_id: '11111111-1111-4111-8111-111111111101',
        title: 'Autumn Cultural & Acoustic Night (Demo)',
        description:
          'An outdoor evening celebration showcasing student acoustic bands, fine arts exhibitions, and local campus food stalls for the wider university community.',
        category: 'cultural',
        city: 'Lahore',
        country: 'Pakistan',
        venue: 'Central Campus Amphitheatre',
        starts_at: isoOffset(55 * dayMs),
        ends_at: isoOffset(55 * dayMs + 6 * hourMs),
        expected_attendees: 900,
        audience_tags: ['Undergraduate Campus', 'Music & Arts', 'Lifestyle'],
        event_objectives: ['Consumer sampling', 'Brand visibility'],
        social_reach: 25000,
        sponsorship_target_minor: 250000,
        currency: 'USD',
        sponsorship_needs: ['Cash', 'Equipment', 'Food'],
        status: 'published',
        is_demo: true,
      },
    ],
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (evtErr) throw evtErr;

  const { error: pkgErr } = await supabase.from('sponsorship_packages').upsert(
    [
      {
        id: '44444444-4444-4444-8444-444444444401',
        event_id: '33333333-3333-4333-8333-333333333301',
        name: 'Bronze Supporter',
        description: 'Digital brand visibility and hackathon prize challenge mention.',
        price_minor: 50000,
        currency: 'USD',
        benefits_json: [
          'Logo on hackathon website and Discord',
          '2 social media spotlight posts',
          'Branded mention in opening ceremony',
        ],
        availability: 4,
        ideal_sponsor_categories: ['Developer Tools', 'Cloud & SaaS'],
        pricing_rationale:
          'Demo reference tier calibrated for early-stage SaaS and local tech brands (~$1.11 per estimated attendee).',
        assumptions_json: ['Attendance is organizer-estimated at 450 builders'],
        ai_generated: false,
        approved_by_organizer: true,
        status: 'active',
      },
      {
        id: '44444444-4444-4444-8444-444444444402',
        event_id: '33333333-3333-4333-8333-333333333301',
        name: 'Silver Builder Partner',
        description: 'On-campus recruitment booth, technical API workshop, and resume book access.',
        price_minor: 150000,
        currency: 'USD',
        benefits_json: [
          '45-minute technical workshop slot',
          'Dedicated recruitment & demo booth',
          'Opt-in student developer resume book',
          'Stage & banner logo placement',
        ],
        availability: 2,
        ideal_sponsor_categories: ['Software Engineering', 'Cloud Infrastructure', 'AI Platforms'],
        pricing_rationale: 'Demo reference tier bundling direct developer engagement and workshop access.',
        assumptions_json: [
          'Attendance is organizer-estimated at 450 builders',
          'Resume sharing is strictly opt-in',
        ],
        ai_generated: false,
        approved_by_organizer: true,
        status: 'active',
      },
      {
        id: '44444444-4444-4444-8444-444444444403',
        event_id: '33333333-3333-4333-8333-333333333301',
        name: 'Gold Title Sponsor',
        description:
          'Co-headline naming rights, keynote slot, dedicated prize track, and judging seat.',
        price_minor: 250000,
        currency: 'USD',
        benefits_json: [
          'Co-headline event branding',
          '10-minute opening keynote',
          'Dedicated sponsored challenge track & judging seat',
          'Premium main-hall booth & all Silver benefits',
        ],
        availability: 1,
        ideal_sponsor_categories: ['Enterprise Tech', 'AI & Cloud', 'FinTech'],
        pricing_rationale: 'Demo anchor tier providing exclusive track ownership and keynote visibility.',
        assumptions_json: ['Single exclusive slot available'],
        ai_generated: false,
        approved_by_organizer: true,
        status: 'active',
      },
      {
        id: '44444444-4444-4444-8444-444444444404',
        event_id: '33333333-3333-4333-8333-333333333303',
        name: 'Festival Stage Partner',
        description: 'Main stage branding and product sampling booth for consumer brands.',
        price_minor: 100000,
        currency: 'USD',
        benefits_json: [
          'Main amphitheatre banner placement',
          'Product sampling kiosk',
          'MC stage shoutouts',
        ],
        availability: 2,
        ideal_sponsor_categories: ['Beverages', 'Consumer Lifestyle', 'Retail'],
        pricing_rationale: 'Demo tier tailored for high-footfall campus consumer activations.',
        assumptions_json: ['Attendance is organizer-estimated at 900 students'],
        ai_generated: false,
        approved_by_organizer: true,
        status: 'active',
      },
    ],
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (pkgErr) throw pkgErr;

  const { error: spErr } = await supabase.from('sponsor_profiles').upsert(
    [
      {
        id: '55555555-5555-4555-8555-555555555501',
        user_id: null,
        company_name: 'Northstar Cloud & DevTools (Demo)',
        industry: 'Technology & Developer Infrastructure',
        description:
          'Cloud developer platform helping engineering teams deploy APIs and AI workflows rapidly.',
        website: 'https://northstar-demo.example.com',
        operating_locations: ['Lahore', 'Karachi', 'Remote'],
        products_services: 'Managed APIs, Cloud Compute Credits, Developer SDKs',
        target_tags: ['Computer Science', 'AI & ML', 'Full-Stack Developers', 'Final-Year Students'],
        objectives: ['Developer hiring', 'API adoption', 'Brand awareness'],
        budget_min_minor: 100000,
        budget_max_minor: 300000,
        currency: 'USD',
        preferred_categories: ['technology', 'business'],
        preferred_locations: ['Lahore', 'Pakistan'],
        preferred_benefits: ['Workshop', 'Booth', 'Speaking slot', 'Recruitment access'],
        contact_email: 'sponsorships@northstar-demo.example.com',
        verification_status: 'verified',
        is_demo: true,
      },
      {
        id: '55555555-5555-4555-8555-555555555502',
        user_id: null,
        company_name: 'PayFlow Campus Wallet (Demo)',
        industry: 'FinTech & Digital Payments',
        description: 'Student-friendly digital wallet and campus commerce API platform.',
        website: 'https://payflow-demo.example.com',
        operating_locations: ['Lahore', 'Islamabad'],
        products_services: 'Campus payments, QR checkout, developer APIs',
        target_tags: ['FinTech', 'Entrepreneurship', 'Computer Science', 'MBA & BBA Students'],
        objectives: ['Startup partnerships', 'API adoption', 'Brand awareness'],
        budget_min_minor: 50000,
        budget_max_minor: 200000,
        currency: 'USD',
        preferred_categories: ['business', 'technology'],
        preferred_locations: ['Lahore', 'Pakistan'],
        preferred_benefits: ['Booth', 'Speaking slot', 'Logo'],
        contact_email: 'partners@payflow-demo.example.com',
        verification_status: 'verified',
        is_demo: true,
      },
      {
        id: '55555555-5555-4555-8555-555555555503',
        user_id: null,
        company_name: 'ZestSip Botanical Drinks (Demo)',
        industry: 'Food & Beverage',
        description:
          'Natural sparkling botanical beverages crafted for university students and live festivals.',
        website: 'https://zestsip-demo.example.com',
        operating_locations: ['Lahore', 'Karachi'],
        products_services: 'Sparkling craft beverages and campus event refreshments',
        target_tags: ['Undergraduate Campus', 'Music & Arts', 'Lifestyle'],
        objectives: ['Consumer sampling', 'Brand visibility'],
        budget_min_minor: 40000,
        budget_max_minor: 120000,
        currency: 'USD',
        preferred_categories: ['cultural', 'sports', 'social'],
        preferred_locations: ['Lahore', 'Pakistan'],
        preferred_benefits: ['Booth', 'Logo', 'Sampling'],
        contact_email: 'campus@zestsip-demo.example.com',
        verification_status: 'verified',
        is_demo: true,
      },
      {
        id: '55555555-5555-4555-8555-555555555504',
        user_id: null,
        company_name: 'Apex Heavy Industrial Logistics (Demo)',
        industry: 'Heavy Manufacturing & Freight',
        description: 'Regional port freight and bulk industrial logistics operator.',
        website: 'https://apexfreight-demo.example.com',
        operating_locations: ['Gwadar', 'Karachi'],
        products_services: 'Bulk maritime shipping and warehouse cranes',
        target_tags: ['Supply Chain Executives', 'Maritime Port Operations'],
        objectives: ['Enterprise B2B leads'],
        budget_min_minor: 500000,
        budget_max_minor: 1000000,
        currency: 'USD',
        preferred_categories: ['other'],
        preferred_locations: ['Karachi'],
        preferred_benefits: ['Executive dinner'],
        contact_email: 'corp@apexfreight-demo.example.com',
        verification_status: 'verified',
        is_demo: true,
      },
    ],
    { onConflict: 'id', ignoreDuplicates: true }
  );
  if (spErr) throw spErr;
}

async function main() {
  await ensureDemoCatalogSeeded();

  for (const item of DEMO_USERS) {
    const user = await findOrCreateAuthUser(item);
    const { error: profileErr } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        role: item.role,
        full_name: item.fullName,
        email: item.email,
        status: 'active',
      },
      { onConflict: 'id' }
    );
    if (profileErr) throw profileErr;

    if (item.linkTable && item.linkId) {
      const { error: linkErr } = await supabase
        .from(item.linkTable)
        .update({ user_id: user.id })
        .eq('id', item.linkId)
        .select('id')
        .single();
      if (linkErr) throw linkErr;
    }

    console.log(`Seeded ${item.role}: ${item.email} (id=${user.id})`);
  }

  console.log('Demo catalog and accounts seeded successfully.');
}

main().catch((err) => {
  console.error('Seed failed:', err.message ?? err);
  process.exit(1);
});
