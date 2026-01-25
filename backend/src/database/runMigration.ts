import fs from 'fs';
import path from 'path';
import { pool } from './db';

const runMigration = async () => {
  try {
    const filePath = path.join(
      __dirname,
      'migrations',
      '002_get_owner_complaints_function.sql'
    );

    const sql = fs.readFileSync(filePath, 'utf8');

    await pool.query(sql);

    console.log('✅ Migration executed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

runMigration();
