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

async function main() {
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
        .eq('id', item.linkId);
      if (linkErr) throw linkErr;
    }

    console.log(`Seeded ${item.role}: ${item.email} (id=${user.id})`);
  }

  console.log('Demo accounts seeded successfully.');
}

main().catch((err) => {
  console.error('Seed failed:', err.message ?? err);
  process.exit(1);
});
