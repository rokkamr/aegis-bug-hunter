const { sql } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const diagnostics = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    env: {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasPostgresUrlNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      postgresUrlPrefix: process.env.POSTGRES_URL ? process.env.POSTGRES_URL.split('@')[1] || 'URL format unexpected' : 'None'
    },
    dbTestResult: null,
    error: null
  };

  try {
    if (!process.env.POSTGRES_URL && !process.env.POSTGRES_URL_NON_POOLING && !process.env.DATABASE_URL) {
      throw new Error('All database environment variables (POSTGRES_URL, DATABASE_URL) are missing.');
    }

    const testQuery = await sql`SELECT 1 as connected`;
    diagnostics.dbTestResult = testQuery.rows;
    return res.status(200).json({ status: 'success', diagnostics });
  } catch (err) {
    diagnostics.error = {
      message: err.message,
      name: err.name,
      stack: err.stack
    };
    return res.status(500).json({ status: 'failed', diagnostics });
  }
};
