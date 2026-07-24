const { verifyToken, sql } = require('./db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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
        SELECT * FROM api_collections 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC
      `;
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { id, name, description, requests } = req.body;
      if (!id || !name) {
        return res.status(400).json({ error: 'Collection ID and name are required' });
      }

      const reqsString = Array.isArray(requests) ? JSON.stringify(requests) : '[]';

      await sql`
        INSERT INTO api_collections (id, user_id, name, description, requests)
        VALUES (${id}, ${userId}, ${name}, ${description || ''}, ${reqsString})
      `;

      const selectResult = await sql`SELECT * FROM api_collections WHERE id = ${id}`;
      return res.status(201).json(selectResult.rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, name, description, requests } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'Collection ID is required' });
      }

      // Check ownership
      const existing = await sql`SELECT user_id FROM api_collections WHERE id = ${id}`;
      if (existing.rowCount === 0) {
        return res.status(404).json({ error: 'Collection not found' });
      }
      if (existing.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const reqsString = Array.isArray(requests) ? JSON.stringify(requests) : undefined;

      if (reqsString !== undefined && name !== undefined) {
        await sql`
          UPDATE api_collections 
          SET name = ${name}, description = ${description || ''}, requests = ${reqsString}
          WHERE id = ${id}
        `;
      } else if (reqsString !== undefined) {
        await sql`
          UPDATE api_collections 
          SET requests = ${reqsString}
          WHERE id = ${id}
        `;
      } else {
        await sql`
          UPDATE api_collections 
          SET name = ${name}, description = ${description || ''}
          WHERE id = ${id}
        `;
      }

      const selectResult = await sql`SELECT * FROM api_collections WHERE id = ${id}`;
      return res.status(200).json(selectResult.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'Collection ID query param is required' });
      }

      // Check ownership
      const existing = await sql`SELECT user_id FROM api_collections WHERE id = ${id}`;
      if (existing.rowCount === 0) {
        return res.status(404).json({ error: 'Collection not found' });
      }
      if (existing.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await sql`DELETE FROM api_collections WHERE id = ${id}`;
      return res.status(200).json({ success: true, message: 'Collection deleted' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Collections API error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};
