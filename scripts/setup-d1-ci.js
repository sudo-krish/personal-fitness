// Node.js script executed in GitHub Actions CI/CD pipeline
// Automates Cloudflare D1 database provisioning, ID resolution, and schema migrations

import { execSync } from 'child_process';
import fs from 'fs';

const DB_NAME = 'fitness-db';
const UUID_REGEX = /([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;

function run(cmd, env = {}) {
  return execSync(cmd, {
    encoding: 'utf8',
    env: { ...process.env, ...env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
}

async function setupDatabase() {
  console.log(`[CI-D1] Checking if Cloudflare D1 database "${DB_NAME}" exists...`);

  let dbId = '';

  // 1. Try to find existing database via wrangler d1 list
  try {
    const listOutput = run('npx wrangler d1 list --json');
    const dbList = JSON.parse(listOutput);
    const db = dbList.find((item) => item.name === DB_NAME);
    dbId = db?.uuid || db?.id || '';
  } catch {
    // Fallback: parse plain text output if --json is unavailable
    try {
      const textOutput = run('npx wrangler d1 list');
      const lines = textOutput.split('\n');
      for (const line of lines) {
        if (line.includes(DB_NAME)) {
          const match = line.match(UUID_REGEX);
          if (match) {
            dbId = match[1];
            break;
          }
        }
      }
    } catch (e) {
      console.log('[CI-D1] Info: could not list existing databases, proceeding to create check:', e.message);
    }
  }

  // 2. Create database if not found
  if (!dbId) {
    console.log(`[CI-D1] Database "${DB_NAME}" not found. Creating now...`);
    try {
      // NOTE: wrangler d1 create does not support --json
      const createOutput = run(`npx wrangler d1 create ${DB_NAME}`);
      console.log('[CI-D1] Create command output:\n', createOutput);

      const tomlMatch = createOutput.match(/database_id\s*=\s*"([0-9a-fA-F-]+)"/i);
      const uuidMatch = createOutput.match(UUID_REGEX);
      dbId = tomlMatch ? tomlMatch[1] : uuidMatch ? uuidMatch[1] : '';

      if (!dbId) {
        throw new Error('Could not parse database_id from wrangler d1 create output');
      }
      console.log(`[CI-D1] Database "${DB_NAME}" successfully created with ID: ${dbId}`);
    } catch (err) {
      // If error indicates database already exists, try to get its id
      const errMsg = err.stderr || err.stdout || err.message;
      console.log('[CI-D1] Create attempt response:', errMsg);
      const uuidMatch = errMsg.match(UUID_REGEX);
      if (uuidMatch) {
        dbId = uuidMatch[1];
        console.log(`[CI-D1] Recovered database ID: ${dbId}`);
      } else {
        console.error('[CI-D1] Fatal: Failed to create or identify D1 database.');
        process.exit(1);
      }
    }
  } else {
    console.log(`[CI-D1] Found existing database "${DB_NAME}" with ID: ${dbId}`);
  }

  // 3. Update wrangler.toml with the resolved database_id
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

  // 4. Apply migrations automatically
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

  // 5. Ensure Cloudflare Pages project exists before deploying
  const PAGES_PROJECT = 'personal-fitness-tracker';
  console.log(`[CI-Pages] Ensuring Cloudflare Pages project "${PAGES_PROJECT}" exists...`);
  try {
    const createPagesOut = run(`npx wrangler pages project create ${PAGES_PROJECT} --production-branch main`);
    console.log(`[CI-Pages] Pages project created successfully:\n`, createPagesOut);
  } catch (err) {
    const errMsg = err.stderr || err.stdout || err.message;
    if (errMsg.includes('already exists') || errMsg.includes('duplicate')) {
      console.log(`[CI-Pages] Pages project "${PAGES_PROJECT}" already exists.`);
    } else {
      console.log(`[CI-Pages] Note during Pages project verification:`, errMsg);
    }
  }
}

setupDatabase().catch((e) => {
  console.error('[CI-D1] Unexpected error:', e);
  process.exit(1);
});
