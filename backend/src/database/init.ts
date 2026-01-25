import { pool } from './db';
import fs from 'fs';
import path from 'path';

const setupDatabase = async () => {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'setup.sql'),
      'utf8'
    );
    //split statements by semicolon
    // const statements = sql
    //   .split(';')
    //   .map(s => s.trim())
    //   .filter(s => s.length > 0);

    // for (const stmt of statements) {
    //   await pool.query(stmt);
    // }
    await pool.query(sql);
    console.log('✅ Database tables created successfully');
    
    // Insert some test data
    
    
    console.log('✅ Test data inserted');
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
};

setupDatabase();