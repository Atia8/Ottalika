import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '99n873azvi',
  database: process.env.DB_NAME || 'ottalika_db',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

// User Model Interface
interface UserAttributes {
  id: string;
  email: string;
  password: string;
  role: 'owner' | 'manager' | 'renter';
  firstName: string;
  lastName: string;
  phone?: string;
  buildingId?: string;
  apartmentNumber?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public email!: string;
  public password!: string;
  public role!: 'owner' | 'manager' | 'renter';
  public firstName!: string;
  public lastName!: string;
  public phone!: string;
  public buildingId!: string;
  public apartmentNumber!: string;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Method to validate password
  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

User.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true,
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('owner', 'manager', 'renter'),
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  phone: {
    type: DataTypes.STRING,
  },
  buildingId: {
    type: DataTypes.STRING,
  },
  apartmentNumber: {
    type: DataTypes.STRING,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user: User) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user: User) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Manager Task Model (keep as is)
class ManagerTask extends Model {
  public id!: string;
  public managerId!: string;
  public taskType!: 'bill_payment' | 'complaint_resolution' | 'renter_approval' | 'payment_verification';
  public title!: string;
  public description!: string;
  public status!: 'pending' | 'in_progress' | 'completed' | 'overdue';
  public priority!: 'low' | 'medium' | 'high';
  public dueDate!: Date;
  public completedAt!: Date | null;
}

ManagerTask.init({
  // ... keep existing ManagerTask model definition
}, {
  sequelize,
  modelName: 'ManagerTask',
  tableName: 'manager_tasks',
  timestamps: true,
});

export { sequelize, User, ManagerTask };