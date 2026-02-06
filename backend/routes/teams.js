const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db/config');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createTeamValidation = [
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Team name must be 2-255 characters')
];

const addMemberValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required')
];

// Get all teams for current user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, tm.user_id as is_member, u.name as owner_name
      FROM teams t
      LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.user_id = $1
      LEFT JOIN users u ON t.owner_id = u.id
      WHERE t.owner_id = $1 OR tm.user_id = $1
      ORDER BY t.created_at DESC
    `, [req.user.id]);

    res.json({ teams: result.rows });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get team details with members
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const teamId = req.params.id;

    // Check if user is member or owner
    const membershipCheck = await pool.query(`
      SELECT 1 FROM teams t
      WHERE t.id = $1 AND (t.owner_id = $2)
      UNION
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = $1 AND tm.user_id = $2
    `, [teamId, req.user.id]);

    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get team details
    const teamResult = await pool.query(`
      SELECT t.*, u.name as owner_name
      FROM teams t
      LEFT JOIN users u ON t.owner_id = u.id
      WHERE t.id = $1
    `, [teamId]);

    // Get team members
    const membersResult = await pool.query(`
      SELECT u.id, u.name, u.email, tm.joined_at
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      WHERE tm.team_id = $1
      ORDER BY tm.joined_at ASC
    `, [teamId]);

    const team = teamResult.rows[0];
    team.members = membersResult.rows;

    res.json({ team });
  } catch (error) {
    console.error('Get team error:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Create new team
router.post('/', isAuthenticated, createTeamValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name } = req.body;

    const result = await pool.query(
      'INSERT INTO teams (name, owner_id) VALUES ($1, $2) RETURNING *',
      [name.trim(), req.user.id]
    );

    res.status(201).json({ 
      message: 'Team created successfully',
      team: result.rows[0]
    });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Add member to team
router.post('/:id/members', isAuthenticated, addMemberValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const teamId = req.params.id;
    const { email } = req.body;

    // Check if user is team owner
    const teamResult = await pool.query(
      'SELECT owner_id FROM teams WHERE id = $1',
      [teamId]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (teamResult.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only team owner can add members' });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User with this email not found' });
    }

    const userId = userResult.rows[0].id;

    // Check if user is already a member
    const existingMember = await pool.query(
      'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'User is already a team member' });
    }

    // Add member
    await pool.query(
      'INSERT INTO team_members (team_id, user_id) VALUES ($1, $2)',
      [teamId, userId]
    );

    res.status(201).json({ message: 'Member added successfully' });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Remove member from team
router.delete('/:id/members/:userId', isAuthenticated, async (req, res) => {
  try {
    const teamId = req.params.id;
    const userIdToRemove = parseInt(req.params.userId);

    // Check if user is team owner
    const teamResult = await pool.query(
      'SELECT owner_id FROM teams WHERE id = $1',
      [teamId]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (teamResult.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only team owner can remove members' });
    }

    // Cannot remove the owner
    if (userIdToRemove === teamResult.rows[0].owner_id) {
      return res.status(400).json({ error: 'Cannot remove team owner' });
    }

    // Remove member
    const result = await pool.query(
      'DELETE FROM team_members WHERE team_id = $1 AND user_id = $2',
      [teamId, userIdToRemove]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Delete team (only owner)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const teamId = req.params.id;

    // Check if user is team owner
    const teamResult = await pool.query(
      'SELECT owner_id FROM teams WHERE id = $1',
      [teamId]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (teamResult.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Only team owner can delete team' });
    }

    // Delete team (cascade will handle members and tasks)
    await pool.query('DELETE FROM teams WHERE id = $1', [teamId]);

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

module.exports = router;
