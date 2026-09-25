import { config } from './config/env.js';
import prisma from './config/db.js';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

function applyMigrations() {
  const backendRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const prismaBin = path.join(backendRoot, 'node_modules', '.bin', process.platform === 'win32' ? 'prisma.cmd' : 'prisma');
  console.log('Applying database migrations...');
  execFileSync(prismaBin, ['migrate', 'deploy'], { cwd: backendRoot, stdio: 'inherit' });
}

async function main() {
  try {
    applyMigrations();
    await prisma.$connect();
    const app = (await import('./app.js')).createApp();

    app.listen(config.port, () => {
      console.log(`Library Management System running on port ${config.port} (${config.nodeEnv})`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main();
