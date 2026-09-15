import { config } from './config/env.js';
import prisma from './config/db.js';

async function main() {
  try {
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
