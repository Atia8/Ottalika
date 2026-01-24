import { pool } from './db';
import fs from 'fs';
import path from 'path';

const setupDatabase = async () => {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'setup.sql'),
      'utf8'
    );
    
    await pool.query(sql);
    console.log('✅ Database tables created successfully');
    
    // Insert some test data
    
    
    console.log('✅ Test data inserted');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
};

setupDatabase();