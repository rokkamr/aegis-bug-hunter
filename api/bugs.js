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
      const { projectId } = req.query;
      let result;
      if (projectId) {
        result = await sql`SELECT * FROM bug_reports WHERE user_id = ${userId} AND project_id = ${projectId} ORDER BY created_at DESC`;
      } else {
        result = await sql`SELECT * FROM bug_reports WHERE user_id = ${userId} ORDER BY created_at DESC`;
      }
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const body = req.body;
      const bugs = Array.isArray(body) ? body : [body];
      const savedBugs = [];

      for (const bug of bugs) {
        const { projectId, fileName, bugType, severity, description, originalCode, fixedCode } = bug;
        if (!fileName || !description) continue;

        const insertResult = await sql`
          INSERT INTO bug_reports (user_id, project_id, file_name, bug_type, severity, description, original_code, fixed_code)
          VALUES (${userId}, ${projectId || null}, ${fileName}, ${bugType || 'code_smell'}, ${severity || 'medium'}, ${description}, ${originalCode || ''}, ${fixedCode || ''})
          RETURNING *
        `;
        savedBugs.push(insertResult.rows[0]);
      }
      
      return res.status(201).json(savedBugs);
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Bugs API error:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};
