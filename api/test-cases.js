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
        SELECT * FROM test_cases 
        WHERE user_id = ${userId} 
           OR project_id IN (SELECT project_id FROM project_members WHERE user_id = ${userId})
           OR project_id IN (SELECT id FROM projects WHERE user_id = ${userId})
        ORDER BY created_at DESC
      `;
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { id, projectId, title, description, steps, expectedResult, priority, category, status } = req.body;
      if (!id || !title) {
        return res.status(400).json({ error: 'ID and title are required' });
      }

      if (projectId) {
        const projectCheck = await sql`
          SELECT id FROM projects WHERE id = ${projectId} AND user_id = ${userId}
          UNION
          SELECT project_id FROM project_members WHERE project_id = ${projectId} AND user_id = ${userId}
        `;
        if (projectCheck.rowCount === 0) {
          return res.status(403).json({ error: 'You do not have access to this project' });
        }
      }

      await sql`
        INSERT INTO test_cases (id, user_id, project_id, title, description, steps, expected_result, status, priority, category)
        VALUES (${id}, ${userId}, ${projectId || null}, ${title}, ${description || ''}, ${steps || ''}, ${expectedResult || ''}, ${status || 'pending'}, ${priority || 'medium'}, ${category || ''})
      `;
      
      const selectResult = await sql`SELECT * FROM test_cases WHERE id = ${id}`;
      return res.status(201).json(selectResult.rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, title, description, steps, expectedResult, priority, category, status, executedAt, notes } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'ID is required for updates' });
      }

      // Check ownership or project membership
      const existing = await sql`SELECT user_id, project_id FROM test_cases WHERE id = ${id}`;
      if (existing.rowCount === 0) {
        return res.status(404).json({ error: 'Test case not found' });
      }
      
      const tc = existing.rows[0];
      let hasAccess = tc.user_id === userId;
      
      if (!hasAccess && tc.project_id) {
        const projectCheck = await sql`
          SELECT id FROM projects WHERE id = ${tc.project_id} AND user_id = ${userId}
          UNION
          SELECT project_id FROM project_members WHERE project_id = ${tc.project_id} AND user_id = ${userId}
        `;
        if (projectCheck.rowCount > 0) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Handle simple status update or full update
      if (status !== undefined) {
        const execTime = executedAt ? new Date(executedAt).toISOString() : null;
        await sql`
          UPDATE test_cases 
          SET status = ${status}, executed_at = ${execTime}, notes = ${notes || ''}
          WHERE id = ${id}
        `;
      } else {
        await sql`
          UPDATE test_cases 
          SET title = ${title}, description = ${description || ''}, steps = ${steps || ''}, 
              expected_result = ${expectedResult || ''}, priority = ${priority || 'medium'}, category = ${category || ''}
          WHERE id = ${id}
        `;
      }

      const selectResult = await sql`SELECT * FROM test_cases WHERE id = ${id}`;
      return res.status(200).json(selectResult.rows[0]);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ error: 'ID query param is required' });
      }

      // Check ownership or project membership
      const existing = await sql`SELECT user_id, project_id FROM test_cases WHERE id = ${id}`;
      if (existing.rowCount === 0) {
        return res.status(404).json({ error: 'Test case not found' });
      }
      
      const tc = existing.rows[0];
      let hasAccess = tc.user_id === userId;
      
      if (!hasAccess && tc.project_id) {
        const projectCheck = await sql`
          SELECT id FROM projects WHERE id = ${tc.project_id} AND user_id = ${userId}
          UNION
          SELECT project_id FROM project_members WHERE project_id = ${tc.project_id} AND user_id = ${userId}
        `;
        if (projectCheck.rowCount > 0) {
          hasAccess = true;
        }
      }

      if (!hasAccess) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await sql`DELETE FROM test_cases WHERE id = ${id}`;
      return res.status(200).json({ success: true, message: 'Test case deleted' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Test Cases API error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};
