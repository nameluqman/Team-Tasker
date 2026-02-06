const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../db/config');
const { isAuthenticated } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const createTaskValidation = [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required and must be 1-255 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('status').optional().isIn(['todo', 'in-progress', 'completed']).withMessage('Invalid status'),
  body('team_id').isInt().withMessage('Team ID must be an integer'),
  body('due_date').optional().isISO8601().withMessage('Due date must be a valid date')
];

const updateTaskValidation = [
  body('title').optional().trim().isLength({ min: 1, max: 255 }).withMessage('Title must be 1-255 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('status').optional().isIn(['todo', 'in-progress', 'completed']).withMessage('Invalid status'),
  body('due_date').optional().isISO8601().withMessage('Due date must be a valid date')
];

// Get all tasks for user (filtered by team and assignment)
router.get('/', isAuthenticated, async (req, res) => {
  try {
    console.log('🔍 Fetching tasks for user:', req.user?.id);
    const { team_id, assigned_to, status } = req.query;
    
    let query = `
      SELECT t.*, 
             u_assign.name as assigned_to_name,
             u_assign.email as assigned_to_email,
             team.name as team_name
      FROM tasks t
      LEFT JOIN users u_assign ON t.assigned_to = u_assign.id
      LEFT JOIN teams team ON t.team_id = team.id
      WHERE (
        t.team_id IN (
          SELECT team_id FROM team_members WHERE user_id = $1
        )
        OR t.team_id IN (
          SELECT id FROM teams WHERE owner_id = $1
        )
      )
    `;
    
    const params = [req.user.id];
    let paramIndex = 2;

    if (team_id) {
      query += ` AND t.team_id = $${paramIndex}`;
      params.push(team_id);
      paramIndex++;
    }

    if (assigned_to) {
      query += ` AND t.assigned_to = $${paramIndex}`;
      params.push(assigned_to);
      paramIndex++;
    }

    if (status) {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ' ORDER BY t.created_at DESC';

    console.log('📝 Executing query:', query);
    console.log('📝 Query params:', params);

    const result = await pool.query(query, params);
    console.log('✅ Tasks fetched successfully:', result.rows.length, 'tasks');
    res.json({ tasks: result.rows });
  } catch (error) {
    console.error('❌ Get tasks error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const taskId = req.params.id;

    const result = await pool.query(`
      SELECT t.*, 
             u_assign.name as assigned_to_name,
             u_assign.email as assigned_to_email,
             team.name as team_name
      FROM tasks t
      LEFT JOIN users u_assign ON t.assigned_to = u_assign.id
      LEFT JOIN teams team ON t.team_id = team.id
      WHERE t.id = $1 AND (
        t.team_id IN (
          SELECT team_id FROM team_members WHERE user_id = $2
        )
        OR t.team_id IN (
          SELECT id FROM teams WHERE owner_id = $2
        )
      )
    `, [taskId, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task: result.rows[0] });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create new task
router.post('/', isAuthenticated, createTaskValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('🔍 Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, status = 'todo', assigned_to, team_id, due_date } = req.body;
    
    console.log('📝 Task creation data:', { title, team_id, assigned_to, user_id: req.user.id });

    // Check if user has access to the team
    const teamAccess = await pool.query(`
      SELECT 1 FROM teams t
      WHERE t.id = $1 AND (t.owner_id = $2)
      UNION
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = $1 AND tm.user_id = $2
    `, [team_id, req.user.id]);

    if (teamAccess.rows.length === 0) {
      console.log('🚫 Team access denied for team_id:', team_id, 'user_id:', req.user.id);
      return res.status(403).json({ error: 'Access denied to this team' });
    }

    // If assigned_to is provided, check if user is team member
    if (assigned_to) {
      const memberCheck = await pool.query(`
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = $1 AND tm.user_id = $2
        UNION
        SELECT 1 FROM teams t
        WHERE t.id = $1 AND t.owner_id = $2
      `, [team_id, assigned_to]);

      if (memberCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Assigned user must be a team member' });
      }
    }

    const result = await pool.query(
      `INSERT INTO tasks (title, description, status, assigned_to, team_id, due_date) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title.trim(), description, status, assigned_to, team_id, due_date]
    );

    res.status(201).json({ 
      message: 'Task created successfully',
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', isAuthenticated, updateTaskValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const taskId = req.params.id;
    const { title, description, status, assigned_to, due_date } = req.body;

    // Check if user has access to the task
    const accessCheck = await pool.query(`
      SELECT t.*, team.owner_id as team_owner_id
      FROM tasks t
      LEFT JOIN teams team ON t.team_id = team.id
      WHERE t.id = $1 AND (
        t.team_id IN (
          SELECT team_id FROM team_members WHERE user_id = $2
        )
        OR t.team_id IN (
          SELECT id FROM teams WHERE owner_id = $2
        )
      )
    `, [taskId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    const task = accessCheck.rows[0];

    // If assigned_to is being updated, check if user is team member
    if (assigned_to !== undefined && assigned_to !== null) {
      const memberCheck = await pool.query(`
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = $1 AND tm.user_id = $2
        UNION
        SELECT 1 FROM teams t
        WHERE t.id = $1 AND t.owner_id = $2
      `, [task.team_id, assigned_to]);

      if (memberCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Assigned user must be a team member' });
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(title.trim());
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (assigned_to !== undefined) {
      updates.push(`assigned_to = $${paramIndex}`);
      params.push(assigned_to);
      paramIndex++;
    }

    if (due_date !== undefined) {
      updates.push(`due_date = $${paramIndex}`);
      params.push(due_date);
      paramIndex++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(taskId);

    const updateQuery = `
      UPDATE tasks 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, params);

    res.json({ 
      message: 'Task updated successfully',
      task: result.rows[0]
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const taskId = req.params.id;

    // Check if user has access to delete the task
    const accessCheck = await pool.query(`
      SELECT 1 FROM tasks t
      WHERE t.id = $1 AND (
        t.team_id IN (
          SELECT team_id FROM team_members WHERE user_id = $2
        )
        OR t.team_id IN (
          SELECT id FROM teams WHERE owner_id = $2
        )
      )
    `, [taskId, req.user.id]);

    if (accessCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found or access denied' });
    }

    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

module.exports = router;
