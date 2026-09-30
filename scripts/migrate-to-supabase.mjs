import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';

const SUPABASE_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_TOKEN || '';
const PROJECT_REF = process.env.SUPABASE_PROJECT_ID || 'nitzhrmcbotdriajaxhw';
const MIGRATIONS_DIR = path.resolve('supabase/migrations');

function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ query: sql });
    const req = https.request(
      {
        hostname: 'api.supabase.com',
        path: `/v1/projects/${PROJECT_REF}/database/query`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SUPABASE_TOKEN}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': 'EiaLink-Migration-Tool',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ ok: true, data: body });
          } else {
            resolve({ ok: false, status: res.statusCode, error: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log(`Starting migration to Supabase project: ${PROJECT_REF}...`);

  // 1. Ensure migration tracking table exists
  await executeSql(`
    CREATE TABLE IF NOT EXISTS public._migrations_applied (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  const appliedRes = await executeSql(`SELECT name FROM public._migrations_applied;`);
  let appliedSet = new Set();
  try {
    const rows = JSON.parse(appliedRes.data || '[]');
    appliedSet = new Set(rows.map((r) => r.name));
  } catch (e) {}

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files in ${MIGRATIONS_DIR}.`);

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`[SKIPPED] ${file} (already applied)`);
      continue;
    }

    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    process.stdout.write(`[APPLYING] ${file}... `);
    const res = await executeSql(sql);

    if (res.ok) {
      await executeSql(`INSERT INTO public._migrations_applied (name) VALUES ('${file}') ON CONFLICT DO NOTHING;`);
      console.log('✅ OK');
    } else {
      console.log(`⚠️ Warning/Error:`, res.error);
      // Check if it's already exists error or critical
      if (res.error && (res.error.includes('already exists') || res.error.includes('duplicate'))) {
        await executeSql(`INSERT INTO public._migrations_applied (name) VALUES ('${file}') ON CONFLICT DO NOTHING;`);
        console.log(`(Marked as applied due to idempotency)`);
      } else {
        console.error(`Stopping on error in ${file}`);
        process.exit(1);
      }
    }
  }

  // 2. Ensure Storage bucket 'bio_media' exists with public read
  console.log('Configuring Supabase Storage buckets...');
  const storageSql = `
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('bio_media', 'bio_media', true)
    ON CONFLICT (id) DO UPDATE SET public = true;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access Bio Media'
      ) THEN
        CREATE POLICY "Public Access Bio Media" ON storage.objects
          FOR SELECT USING (bucket_id = 'bio_media');
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Upload Bio Media'
      ) THEN
        CREATE POLICY "Authenticated Upload Bio Media" ON storage.objects
          FOR INSERT WITH CHECK (bucket_id = 'bio_media');
      END IF;
    END $$;
  `;
  const storageRes = await executeSql(storageSql);
  if (storageRes.ok) {
    console.log('✅ Storage bucket "bio_media" configured successfully!');
  } else {
    console.log('⚠️ Storage configuration:', storageRes.error);
  }

  console.log('🎉 Migration completed successfully!');
}

run().catch((err) => {
  console.error('Fatal error running migrations:', err);
  process.exit(1);
});
