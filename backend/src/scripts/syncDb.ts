import { sequelize } from '../models';
import dotenv from 'dotenv';

dotenv.config();

async function syncDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established.');
    
    // Sync all models
    await sequelize.sync({ force: true }); // Use { alter: true } in production
    console.log('✅ All tables created successfully.');
    
    console.log('\n📊 YOUR SCHEMA IS READY:');
    console.log('1. users - All system users');
    console.log('2. buildings - Buildings you manage');
    console.log('3. units - Apartments/Units in buildings');
    console.log('4. bills - Rent and utility bills');
    console.log('5. maintenance_requests - Maintenance issues');
    console.log('6. manager_tasks - Your task list');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database sync failed:', error);
    process.exit(1);
  }
}

syncDatabase();