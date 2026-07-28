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

    const emailLower = email.toLowerCase().trim();

    // Default Super Admin credential shortcut
    if (emailLower === 'admin@aegis.com' && (password === 'admin' || password === 'admin123' || password === 'admin@aegis.com')) {
      const adminToken = generateToken('admin-super-id');
      return res.status(200).json({
        message: 'Admin login successful',
        token: adminToken,
        email: 'admin@aegis.com',
        fullName: 'System Administrator',
        phone: '1234567890',
        country: 'United States',
        company: 'Aegis AI Core',
        role: 'Admin'
      });
    }

    // Query user
    const userResult = await sql`SELECT * FROM users WHERE email = ${emailLower}`;
    if (userResult.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Verify hash
    const loginHash = crypto.pbkdf2Sync(password, user.salt, 1000, 64, 'sha512').toString('hex');
    if (loginHash !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user.id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      email: user.email,
      fullName: user.full_name,
      phone: user.phone,
      country: user.country,
      company: user.company,
      role: user.role
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};
