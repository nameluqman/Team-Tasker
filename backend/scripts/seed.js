const { pool } = require('../db/config');
const bcrypt = require('bcrypt');

async function seedDatabase() {
  try {
    console.log('Seeding database...');

    // Create sample users
    const hashedPassword1 = await bcrypt.hash('password123', 12);
    const hashedPassword2 = await bcrypt.hash('password123', 12);
    const hashedPassword3 = await bcrypt.hash('password123', 12);

    const usersResult = await pool.query(`
      INSERT INTO users (name, email, password) VALUES
        ('John Doe', 'john@example.com', $1),
        ('Jane Smith', 'jane@example.com', $2),
        ('Mike Johnson', 'mike@example.com', $3)
      ON CONFLICT (email) DO NOTHING
      RETURNING id, name, email
    `, [hashedPassword1, hashedPassword2, hashedPassword3]);

    console.log('✓ Sample users created');

    // Get user IDs
    const users = usersResult.rows;
    const john = users.find(u => u.email === 'john@example.com');
    const jane = users.find(u => u.email === 'jane@example.com');
    const mike = users.find(u => u.email === 'mike@example.com');

    // Create sample teams
    const teamsResult = await pool.query(`
      INSERT INTO teams (name, owner_id) VALUES
        ('Development Team', $1),
        ('Marketing Team', $2),
        ('Design Team', $3)
      ON CONFLICT DO NOTHING
      RETURNING id, name, owner_id
    `, [john.id, jane.id, mike.id]);

    console.log('✓ Sample teams created');

    const teams = teamsResult.rows;
    const devTeam = teams.find(t => t.name === 'Development Team');
    const marketingTeam = teams.find(t => t.name === 'Marketing Team');
    const designTeam = teams.find(t => t.name === 'Design Team');

    // Add team members
    await pool.query(`
      INSERT INTO team_members (team_id, user_id) VALUES
        ($1, $2), ($1, $3),
        ($4, $1), ($4, $3),
        ($5, $1), ($5, $2)
      ON CONFLICT DO NOTHING
    `, [devTeam.id, john.id, jane.id, marketingTeam.id, jane.id, mike.id, designTeam.id, john.id, mike.id]);

    console.log('✓ Team members added');

    // Create sample tasks
    await pool.query(`
      INSERT INTO tasks (title, description, status, assigned_to, team_id, due_date, created_by) VALUES
        ('Setup project repository', 'Initialize Git repository and create initial structure', 'completed', $1, $2, CURRENT_DATE + INTERVAL '7 days', $1),
        ('Design database schema', 'Create ERD and define tables for the application', 'in-progress', $3, $2, CURRENT_DATE + INTERVAL '5 days', $1),
        ('Implement authentication', 'Add user registration and login functionality', 'todo', $3, $2, CURRENT_DATE + INTERVAL '10 days', $1),
        ('Create marketing materials', 'Design brochures and social media graphics', 'in-progress', $4, $5, CURRENT_DATE + INTERVAL '3 days', $4),
        ('User research', 'Conduct user interviews and surveys', 'completed', $1, $6, CURRENT_DATE - INTERVAL '2 days', $4),
        ('UI mockups', 'Create wireframes and high-fidelity mockups', 'todo', $3, $6, CURRENT_DATE + INTERVAL '14 days', $4)
      ON CONFLICT DO NOTHING
    `, [john.id, devTeam.id, jane.id, mike.id, marketingTeam.id, designTeam.id]);

    console.log('✓ Sample tasks created');

    console.log('Database seeding completed successfully!');
    console.log('\nSample login credentials:');
    console.log('Email: john@example.com, Password: password123');
    console.log('Email: jane@example.com, Password: password123');
    console.log('Email: mike@example.com, Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
