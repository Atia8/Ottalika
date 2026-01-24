// backend/check-db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'ottalika_db',
  user: 'postgres',
  password: '99n873azvi' // your password
});

async function checkTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);
    
    console.log('Users table columns:');
    result.rows.forEach(row => {
      console.log(`  ${row.column_name} (${row.data_type})`);
    });
    
    // Also check sample data
    const sample = await pool.query('SELECT * FROM users LIMIT 1');
    if (sample.rows.length > 0) {
      console.log('\nSample user row:', sample.rows[0]);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTable();