const { initDb, generateToken, sql } = require('../db');
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await initDb();
    
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const emailLower = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await sql`SELECT id FROM users WHERE email = ${emailLower}`;
    if (existingUser.rowCount > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');

    // Insert user
    const insertResult = await sql`
      INSERT INTO users (email, password_hash, salt)
      VALUES (${emailLower}, ${passwordHash}, ${salt})
      RETURNING id, email
    `;

    const newUser = insertResult.rows[0];
    const token = generateToken(newUser.id);

    return res.status(201).json({
      message: 'User registered successfully',
      token,
      email: newUser.email
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};
