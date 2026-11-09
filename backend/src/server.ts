import { app } from './app';
import { env } from './config/env';

const server = app.listen(env.PORT, () => {
  console.log('====================================================');
  console.log(`🚀 FleetPulse TMS Backend Server running on port ${env.PORT}`);
  console.log(`📡 Environment: ${env.NODE_ENV}`);
  console.log(`🏥 Health Check: http://localhost:${env.PORT}/health`);
  console.log(`🔗 API Base: http://localhost:${env.PORT}/api`);
  console.log(`🌐 Allowed CORS: ${env.CORS_ORIGINS.join(', ')}`);
  console.log('====================================================');
});

// Graceful Shutdown
const shutdown = () => {
  console.log('\n[Server] Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

