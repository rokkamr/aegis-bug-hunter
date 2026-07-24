const { verifyToken, sql } = require('../db');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const userId = verifyToken(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const { projectId } = req.query;
      if (!projectId) {
        return res.status(400).json({ error: 'Project ID is required' });
      }

      // Check if user is member of project
      const accessCheck = await sql`
        SELECT id FROM projects WHERE id = ${projectId} AND user_id = ${userId}
        UNION
        SELECT project_id FROM project_members WHERE project_id = ${projectId} AND user_id = ${userId}
      `;
      if (accessCheck.rowCount === 0) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Fetch all members (including project owner)
      const ownerResult = await sql`
        SELECT u.id, u.email, 'owner' as role 
        FROM projects p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.id = ${projectId}
      `;
      
      const membersResult = await sql`
        SELECT u.id, u.email, pm.role 
        FROM project_members pm 
        JOIN users u ON pm.user_id = u.id 
        WHERE pm.project_id = ${projectId}
      `;

      const allMembers = [...ownerResult.rows, ...membersResult.rows];
      return res.status(200).json(allMembers);
    }

    if (req.method === 'POST') {
      const { projectId, email, role } = req.body;
      if (!projectId || !email) {
        return res.status(400).json({ error: 'Project ID and email are required' });
      }

      // Verify current user is project owner
      const ownerCheck = await sql`SELECT user_id FROM projects WHERE id = ${projectId}`;
      if (ownerCheck.rowCount === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      if (ownerCheck.rows[0].user_id !== userId) {
        return res.status(403).json({ error: 'Only the project owner can invite collaborators' });
      }

      // Find user by email
      const targetEmail = email.toLowerCase().trim();
      
      // Prevent owner from inviting themselves
      const ownerEmailCheck = await sql`SELECT email FROM users WHERE id = ${userId}`;
      if (ownerEmailCheck.rows[0].email === targetEmail) {
        return res.status(400).json({ error: 'You cannot invite yourself as a collaborator' });
      }

      const userResult = await sql`SELECT id, email FROM users WHERE email = ${targetEmail}`;
      if (userResult.rowCount === 0) {
        return res.status(404).json({ error: `User with email "${email}" is not registered on Aegis.` });
      }

      const invitee = userResult.rows[0];

      // Check if already a collaborator
      const existingCheck = await sql`
        SELECT role FROM project_members 
        WHERE project_id = ${projectId} AND user_id = ${invitee.id}
      `;
      if (existingCheck.rowCount > 0) {
        return res.status(400).json({ error: 'User is already a collaborator on this project' });
      }

      // Add as collaborator
      const memberRole = role || 'collaborator';
      await sql`
        INSERT INTO project_members (project_id, user_id, role)
        VALUES (${projectId}, ${invitee.id}, ${memberRole})
      `;

      return res.status(201).json({
        id: invitee.id,
        email: invitee.email,
        role: memberRole
      });
    }

    if (req.method === 'DELETE') {
      const { projectId, collaboratorId } = req.query;
      if (!projectId || !collaboratorId) {
        return res.status(400).json({ error: 'Project ID and collaborator ID are required' });
      }

      // Verify current user is project owner or the collaborator themselves
      const ownerCheck = await sql`SELECT user_id FROM projects WHERE id = ${projectId}`;
      if (ownerCheck.rowCount === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      const isOwner = ownerCheck.rows[0].user_id === userId;
      const isSelf = parseInt(collaboratorId, 10) === userId;

      if (!isOwner && !isSelf) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      await sql`
        DELETE FROM project_members 
        WHERE project_id = ${projectId} AND user_id = ${collaboratorId}
      `;

      return res.status(200).json({ success: true, message: 'Collaborator removed' });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (err) {
    console.error('Collaborators API error:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
};
