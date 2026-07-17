const { sql } = require('@vercel/postgres');
const crypto = require('crypto');

async function initDb() {
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        salt VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create projects table
    await sql`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        path VARCHAR(1024) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create test_cases table
    await sql`
      CREATE TABLE IF NOT EXISTS test_cases (
        id VARCHAR(255) PRIMARY KEY,
        user_id INT NOT NULL,
        project_id INT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        steps TEXT,
        expected_result TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        priority VARCHAR(50) DEFAULT 'medium',
        category VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        executed_at TIMESTAMP,
        notes TEXT
      );
    `;

    // Create bug_reports table
    await sql`
      CREATE TABLE IF NOT EXISTS bug_reports (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        project_id INT,
        file_name VARCHAR(1024) NOT NULL,
        bug_type VARCHAR(255),
        severity VARCHAR(50),
        description TEXT,
        original_code TEXT,
        fixed_code TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  }
}

function verifyToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const [userIdStr, timestamp, signature] = token.split('.');
    if (!userIdStr || !timestamp || !signature) return null;
    
    // Check expiration (7 days)
    const elapsed = Date.now() - parseInt(timestamp, 10);
    if (elapsed > 7 * 24 * 60 * 60 * 1000) return null;

    // Verify signature
    const secret = process.env.POSTGRES_URL || 'aegis-secret-key';
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${userIdStr}.${timestamp}`)
      .digest('hex');

    if (signature === expectedSignature) {
      return parseInt(userIdStr, 10);
    }
  } catch (err) {
    return null;
  }
  return null;
}

function generateToken(userId) {
  const timestamp = Date.now();
  const secret = process.env.POSTGRES_URL || 'aegis-secret-key';
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${userId}.${timestamp}`)
    .digest('hex');
  return `${userId}.${timestamp}.${signature}`;
}

module.exports = {
  initDb,
  verifyToken,
  generateToken,
  sql
};
