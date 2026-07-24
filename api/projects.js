const { verifyToken, sql } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const userId = verifyToken(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized. Invalid or expired token' });
  }

  try {
    if (req.method === 'GET') {
      const result = await sql`
        SELECT p.*, u.email as owner_email 
        FROM projects p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.user_id = ${userId} 
           OR p.id IN (SELECT project_id FROM project_members WHERE user_id = ${userId}) 
        ORDER BY p.created_at DESC
      `;
      return res.status(200).json(result.rows);
    } 
    
    if (req.method === 'POST') {
      const { name, path } = req.body;
      if (!name || !path) {
        return res.status(400).json({ error: 'Project name and path are required' });
      }

      // Check if project path already exists for this user
      const existingProject = await sql`
        SELECT * FROM projects 
        WHERE user_id = ${userId} AND (path = ${path} OR name = ${name})
      `;
      if (existingProject.rowCount > 0) {
        return res.status(200).json(existingProject.rows[0]);
      }

      const insertResult = await sql`
        INSERT INTO projects (user_id, name, path)
        VALUES (${userId}, ${name}, ${path})
        RETURNING *
      `;
      return res.status(201).json(insertResult.rows[0]);
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Projects API error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};
