const app = require('./app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 3000;

/**
 * Start the server after verifying DB connection.
 */
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync models (in development only — use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      // Do NOT force sync — use migrations instead
      // await sequelize.sync({ alter: true });
      console.log('📦 Models loaded. Use migrations for schema management.');
    }

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📂 Uploads served at: http://localhost:${PORT}/uploads`);
    });
  } catch (err) {
    console.error('❌ Unable to start server:', err.message);
    process.exit(1);
  }
};

startServer();
