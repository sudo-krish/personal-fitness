// Node.js script executed in GitHub Actions CI/CD pipeline
// Automates Cloudflare D1 database provisioning, ID resolution, and schema migrations

import { execSync } from 'child_process';
import fs from 'fs';

const DB_NAME = 'fitness-db';

function run(cmd, env = {}) {
  return execSync(cmd, {
    encoding: 'utf8',
    env: { ...process.env, ...env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

async function setupDatabase() {
  console.log(`[CI-D1] Checking if Cloudflare D1 database "${DB_NAME}" exists...`);
  
  let dbList = [];
  try {
    const listOutput = run('npx wrangler d1 list --json');
    dbList = JSON.parse(listOutput);
  } catch (err) {
    console.error('[CI-D1] Warning: Failed to list D1 databases. Error:', err.message);
  }

  let db = dbList.find((item) => item.name === DB_NAME);
  let dbId = db?.uuid || db?.id || '';

  if (!dbId) {
    console.log(`[CI-D1] Database "${DB_NAME}" does not exist. Creating now...`);
    try {
      const createOutput = run(`npx wrangler d1 create ${DB_NAME} --json`);
      const createRes = JSON.parse(createOutput);
      dbId = createRes.database_id || createRes.uuid || createRes.id || '';
      console.log(`[CI-D1] Database "${DB_NAME}" successfully created with ID: ${dbId}`);
    } catch (err) {
      console.error('[CI-D1] Failed to create D1 database:', err.stderr || err.message);
      process.exit(1);
    }
  } else {
    console.log(`[CI-D1] Found existing database "${DB_NAME}" with ID: ${dbId}`);
  }

  // Update wrangler.toml with the resolved database_id
  const wranglerPath = 'wrangler.toml';
  if (fs.existsSync(wranglerPath)) {
    let wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
    wranglerContent = wranglerContent.replace(
      /database_id\s*=\s*"[^"]*"/,
      `database_id = "${dbId}"`
    );
    fs.writeFileSync(wranglerPath, wranglerContent, 'utf8');
    console.log(`[CI-D1] Updated wrangler.toml with database_id: ${dbId}`);
  }

  // Apply migrations automatically
  console.log('[CI-D1] Applying pending D1 schema migrations...');
  try {
    const migrateCmd = `echo "y" | npx wrangler d1 migrations apply ${DB_NAME} --remote`;
    const migrateOut = run(migrateCmd);
    console.log('[CI-D1] Migrations output:\n', migrateOut);
    console.log('[CI-D1] Schema migrations applied successfully.');
  } catch (err) {
    console.error('[CI-D1] Error applying migrations:', err.stderr || err.message);
    process.exit(1);
  }
}

setupDatabase().catch((e) => {
  console.error('[CI-D1] Unexpected error:', e);
  process.exit(1);
});
