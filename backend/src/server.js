import { loadConfig } from './config.js';
import { createApp } from './app.js';

const config = loadConfig();
const app = createApp(config);
const server = app.listen(config.port, () => {
  console.log(`learn-physics-api listening on http://localhost:${config.port} (database ${config.dbConfigured ? 'connected' : 'NOT configured'})`);
});

// Graceful shutdown
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => { server.close(() => process.exit(0)); setTimeout(() => process.exit(1), 10000).unref(); });
}
