-- FESTIVALMINT AI — Fictional Demo Seed Data
-- Note: All organizations, societies, events, and sponsors below are clearly labeled fictional demo data (`is_demo = true`).
-- Note on auth users: Create demo auth accounts via the secure seed API/script (`scripts/seed-demo.ts`) which binds `auth.users` IDs to `profiles`.
-- This SQL seeds public catalog data (universities, demo societies, demo events, demo packages, and demo sponsor profiles) safely with `user_id = null` until bound by the seed script.

insert into public.universities (id, name, city, country, website, verification_status, is_demo)
values
  ('11111111-1111-4111-8111-111111111101', 'Lahore Tech & Sciences University (Demo)', 'Lahore', 'Pakistan', 'https://demo-university.example.edu', 'verified', true)
on conflict (id) do nothing;

insert into public.organizer_profiles (
  id, user_id, society_name, university_id, university_name, campus_city, category, description,
  contact_person, official_email, verification_status, is_demo
)
values
  (
    '22222222-2222-4222-8222-222222222201',
    null,
    'CampusSpark Tech Society (Demo)',
    '11111111-1111-4111-8111-111111111101',
    'Lahore Tech & Sciences University (Demo)',
    'Lahore',
    'Technology',
    'Student-led computer science and product engineering society running annual hackathons, AI workshops, and developer career fairs.',
    'Amina Tariq',
    'campusspark.demo@example.edu',
    'verified',
    true
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    null,
    'Civic & Arts Guild (Demo)',
    '11111111-1111-4111-8111-111111111101',
    'Lahore Tech & Sciences University (Demo)',
    'Lahore',
    'Cultural',
    'Inter-university performing arts, visual design showcase, and cultural festival committee.',
    'Bilal Hassan',
    'civicarts.demo@example.edu',
    'verified',
    true
  )
on conflict (id) do nothing;

insert into public.events (
  id, organizer_id, university_id, title, description, category, city, country, venue,
  starts_at, ends_at, expected_attendees, audience_tags, event_objectives, social_reach,
  sponsorship_target_minor, currency, sponsorship_needs, status, is_demo
)
values
  (
    '33333333-3333-4333-8333-333333333301',
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111101',
    'BuildFest Campus AI Hackathon 2026 (Demo)',
    'A 36-hour inter-university software and AI engineering hackathon bringing together senior CS students, full-stack builders, and product designers to build real-world prototypes.',
    'technology',
    'Lahore',
    'Pakistan',
    'Main Innovation Auditorium',
    now() + interval '30 days',
    now() + interval '32 days',
    450,
    array['Computer Science', 'AI & ML', 'Full-Stack Developers', 'Final-Year Students'],
    array['Developer hiring', 'API adoption', 'Brand awareness'],
    18500,
    450000,
    'USD',
    array['Cash', 'Prizes', 'Software credits', 'Food'],
    'published',
    true
  ),
  (
    '33333333-3333-4333-8333-333333333302',
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111101',
    'Campus Founders & FinTech Summit (Demo)',
    'A full-day entrepreneurship and payments symposium featuring startup pitch competitions, investor panels, and student career networking booths.',
    'business',
    'Lahore',
    'Pakistan',
    'School of Business Atrium',
    now() + interval '45 days',
    now() + interval '45 days' + interval '8 hours',
    300,
    array['Entrepreneurship', 'FinTech', 'MBA & BBA Students', 'Product Management'],
    array['Startup partnerships', 'Lead generation', 'Thought leadership'],
    12000,
    300000,
    'USD',
    array['Cash', 'Prizes', 'Venue'],
    'approved',
    true
  ),
  (
    '33333333-3333-4333-8333-333333333303',
    '22222222-2222-4222-8222-222222222202',
    '11111111-1111-4111-8111-111111111101',
    'Autumn Cultural & Acoustic Night (Demo)',
    'An outdoor evening celebration showcasing student acoustic bands, fine arts exhibitions, and local campus food stalls for the wider university community.',
    'cultural',
    'Lahore',
    'Pakistan',
    'Central Campus Amphitheatre',
    now() + interval '55 days',
    now() + interval '55 days' + interval '6 hours',
    900,
    array['Undergraduate Campus', 'Music & Arts', 'Lifestyle'],
    array['Consumer sampling', 'Brand visibility'],
    25000,
    250000,
    'USD',
    array['Cash', 'Equipment', 'Food'],
    'published',
    true
  )
on conflict (id) do nothing;

insert into public.sponsorship_packages (
  id, event_id, name, description, price_minor, currency, benefits_json, availability,
  ideal_sponsor_categories, pricing_rationale, assumptions_json, ai_generated, approved_by_organizer, status
)
values
  (
    '44444444-4444-4444-8444-444444444401',
    '33333333-3333-4333-8333-333333333301',
    'Bronze Supporter',
    'Digital brand visibility and hackathon prize challenge mention.',
    50000,
    'USD',
    '["Logo on hackathon website and Discord", "2 social media spotlight posts", "Branded mention in opening ceremony"]'::jsonb,
    4,
    array['Developer Tools', 'Cloud & SaaS'],
    'Demo reference tier calibrated for early-stage SaaS and local tech brands (~$1.11 per estimated attendee).',
    '["Attendance is organizer-estimated at 450 builders"]'::jsonb,
    false,
    true,
    'active'
  ),
  (
    '44444444-4444-4444-8444-444444444402',
    '33333333-3333-4333-8333-333333333301',
    'Silver Builder Partner',
    'On-campus recruitment booth, technical API workshop, and resume book access.',
    150000,
    'USD',
    '["45-minute technical workshop slot", "Dedicated recruitment & demo booth", "Opt-in student developer resume book", "Stage & banner logo placement"]'::jsonb,
    2,
    array['Software Engineering', 'Cloud Infrastructure', 'AI Platforms'],
    'Demo reference tier bundling direct developer engagement and workshop access.',
    '["Attendance is organizer-estimated at 450 builders", "Resume sharing is strictly opt-in"]'::jsonb,
    false,
    true,
    'active'
  ),
  (
    '44444444-4444-4444-8444-444444444403',
    '33333333-3333-4333-8333-333333333301',
    'Gold Title Sponsor',
    'Co-headline naming rights, keynote slot, dedicated prize track, and judging seat.',
    250000,
    'USD',
    '["Co-headline event branding", "10-minute opening keynote", "Dedicated sponsored challenge track & judging seat", "Premium main-hall booth & all Silver benefits"]'::jsonb,
    1,
    array['Enterprise Tech', 'AI & Cloud', 'FinTech'],
    'Demo anchor tier providing exclusive track ownership and keynote visibility.',
    '["Single exclusive slot available"]'::jsonb,
    false,
    true,
    'active'
  ),
  (
    '44444444-4444-4444-8444-444444444404',
    '33333333-3333-4333-8333-333333333303',
    'Festival Stage Partner',
    'Main stage branding and product sampling booth for consumer brands.',
    100000,
    'USD',
    '["Main amphitheatre banner placement", "Product sampling kiosk", "MC stage shoutouts"]'::jsonb,
    2,
    array['Beverages', 'Consumer Lifestyle', 'Retail'],
    'Demo tier tailored for high-footfall campus consumer activations.',
    '["Attendance is organizer-estimated at 900 students"]'::jsonb,
    false,
    true,
    'active'
  )
on conflict (id) do nothing;

-- Four fictional demo sponsors engineered to demonstrate strong vs. weak AI match rankings
insert into public.sponsor_profiles (
  id, user_id, company_name, industry, description, website, operating_locations,
  products_services, target_tags, objectives, budget_min_minor, budget_max_minor, currency,
  preferred_categories, preferred_locations, preferred_benefits, contact_email, verification_status, is_demo
)
values
  (
    '55555555-5555-4555-8555-555555555501',
    null,
    'Northstar Cloud & DevTools (Demo)',
    'Technology & Developer Infrastructure',
    'Cloud developer platform helping engineering teams deploy APIs and AI workflows rapidly.',
    'https://northstar-demo.example.com',
    array['Lahore', 'Karachi', 'Remote'],
    'Managed APIs, Cloud Compute Credits, Developer SDKs',
    array['Computer Science', 'AI & ML', 'Full-Stack Developers', 'Final-Year Students'],
    array['Developer hiring', 'API adoption', 'Brand awareness'],
    100000,
    300000,
    'USD',
    array['technology', 'business'],
    array['Lahore', 'Pakistan'],
    array['Workshop', 'Booth', 'Speaking slot', 'Recruitment access'],
    'sponsorships@northstar-demo.example.com',
    'verified',
    true
  ),
  (
    '55555555-5555-4555-8555-555555555502',
    null,
    'PayFlow Campus Wallet (Demo)',
    'FinTech & Digital Payments',
    'Student-friendly digital wallet and campus commerce API platform.',
    'https://payflow-demo.example.com',
    array['Lahore', 'Islamabad'],
    'Campus payments, QR checkout, developer APIs',
    array['FinTech', 'Entrepreneurship', 'Computer Science', 'MBA & BBA Students'],
    array['Startup partnerships', 'API adoption', 'Brand awareness'],
    50000,
    200000,
    'USD',
    array['business', 'technology'],
    array['Lahore', 'Pakistan'],
    array['Booth', 'Speaking slot', 'Logo'],
    'partners@payflow-demo.example.com',
    'verified',
    true
  ),
  (
    '55555555-5555-4555-8555-555555555503',
    null,
    'ZestSip Botanical Drinks (Demo)',
    'Food & Beverage',
    'Natural sparkling botanical beverages crafted for university students and live festivals.',
    'https://zestsip-demo.example.com',
    array['Lahore', 'Karachi'],
    'Sparkling craft beverages and campus event refreshments',
    array['Undergraduate Campus', 'Music & Arts', 'Lifestyle'],
    array['Consumer sampling', 'Brand visibility'],
    40000,
    120000,
    'USD',
    array['cultural', 'sports', 'social'],
    array['Lahore', 'Pakistan'],
    array['Booth', 'Logo', 'Sampling'],
    'campus@zestsip-demo.example.com',
    'verified',
    true
  ),
  (
    '55555555-5555-4555-8555-555555555504',
    null,
    'Apex Heavy Industrial Logistics (Demo)',
    'Heavy Manufacturing & Freight',
    'Regional port freight and bulk industrial logistics operator.',
    'https://apexfreight-demo.example.com',
    array['Gwadar', 'Karachi'],
    'Bulk maritime shipping and warehouse cranes',
    array['Supply Chain Executives', 'Maritime Port Operations'],
    array['Enterprise B2B leads'],
    500000,
    1000000,
    'USD',
    array['other'],
    array['Karachi'],
    array['Executive dinner'],
    'corp@apexfreight-demo.example.com',
    'verified',
    true
  )
on conflict (id) do nothing;

