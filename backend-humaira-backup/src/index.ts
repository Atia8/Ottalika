import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { sequelize, User } from './models';

// Import routes
import authRoutes from './routes/auth.routes';
import managerRoutes from './routes/manager.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: '🚀 Smart Building Management System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: 'PostgreSQL'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/manager', managerRoutes);

// Seed database with initial users
const seedDatabase = async () => {
  try {
    // Check if any users exist
    const userCount = await User.count();
    
    if (userCount === 0) {
      console.log('🌱 Seeding database with initial users...');
      
      // Define user data with proper interface
      interface SeedUser {
        email: string;
        password: string;
        role: 'owner' | 'manager' | 'renter';
        firstName: string;
        lastName: string;
        phone: string;
        buildingId: string;
        apartmentNumber?: string;
        isActive: boolean;
      }

      const sampleUsers: SeedUser[] = [
        {
          email: 'manager@ottalika.com',
          password: 'manager123',
          role: 'manager',
          firstName: 'John',
          lastName: 'Manager',
          phone: '+1234567890',
          buildingId: 'BLD001',
          isActive: true
        },
        {
          email: 'owner@ottalika.com',
          password: 'owner123',
          role: 'owner',
          firstName: 'Sarah',
          lastName: 'Owner',
          phone: '+1234567891',
          buildingId: 'BLD001',
          isActive: true
        },
        {
          email: 'renter@ottalika.com',
          password: 'renter123',
          role: 'renter',
          firstName: 'Mike',
          lastName: 'Renter',
          phone: '+1234567892',
          buildingId: 'BLD001',
          apartmentNumber: '101',
          isActive: true
        }
      ];

      for (const userData of sampleUsers) {
        await User.create(userData);
      }
      
      console.log('✅ Database seeded successfully!');
    }
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
};

// 404 handler for all unmatched routes (FIXED for Express 5)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: Function) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync models
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database models synchronized.');

    // Seed database
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`
=========================================
🚀 Server started successfully!
📡 Port: ${PORT}
🌐 URL: http://localhost:${PORT}
📊 Health: http://localhost:${PORT}/api/health
🔐 Auth: http://localhost:${PORT}/api/auth
👨‍💼 Manager: http://localhost:${PORT}/api/manager
=========================================
      `);
      console.log('📝 Sample credentials:');
      console.log('👨‍💼 Manager: manager@ottalika.com / manager123');
      console.log('👑 Owner: owner@ottalika.com / owner123');
      console.log('👤 Renter: renter@ottalika.com / renter123');
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();