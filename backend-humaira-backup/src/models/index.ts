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

// ==================== EXISTING MODELS (Keep these) ====================

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
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'isActive' | 'isVerified' | 'createdAt' | 'updatedAt'> {}

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
  public isVerified!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

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
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
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
      // Auto-verify managers and owners
      if (user.role === 'manager' || user.role === 'owner') {
        user.isVerified = true;
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

// ==================== YOUR NEW MANAGER-SPECIFIC MODELS ====================

// 1. Building Model (YOURS - Managers manage buildings)
interface BuildingAttributes {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  managerId: string;
  ownerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class Building extends Model<BuildingAttributes> implements BuildingAttributes {
  public id!: string;
  public name!: string;
  public address!: string;
  public totalUnits!: number;
  public managerId!: string;
  public ownerId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Building.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  totalUnits: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  managerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    }
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    }
  },
}, {
  sequelize,
  modelName: 'Building',
  tableName: 'buildings',
  timestamps: true,
});

// 2. Unit/Apartment Model (YOURS - Managers assign units)
interface UnitAttributes {
  id: string;
  unitNumber: string;
  buildingId: string;
  renterId?: string;
  rentAmount: number;
  size?: string;
  status: 'vacant' | 'occupied' | 'under_maintenance';
  createdAt?: Date;
  updatedAt?: Date;
}

class Unit extends Model<UnitAttributes> implements UnitAttributes {
  public id!: string;
  public unitNumber!: string;
  public buildingId!: string;
  public renterId!: string;
  public rentAmount!: number;
  public size!: string;
  public status!: 'vacant' | 'occupied' | 'under_maintenance';
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Unit.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  unitNumber: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  buildingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'buildings',
      key: 'id',
    }
  },
  renterId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    }
  },
  rentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  size: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM('vacant', 'occupied', 'under_maintenance'),
    defaultValue: 'vacant',
  },
}, {
  sequelize,
  modelName: 'Unit',
  tableName: 'units',
  timestamps: true,
});

// 3. Bill Model (YOURS - Managers create bills)
interface BillAttributes {
  id: string;
  unitId: string;
  renterId: string;
  amount: number;
  dueDate: Date;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  type: 'rent' | 'maintenance' | 'electricity' | 'water' | 'other';
  description?: string;
  lateFee?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

class Bill extends Model<BillAttributes> implements BillAttributes {
  public id!: string;
  public unitId!: string;
  public renterId!: string;
  public amount!: number;
  public dueDate!: Date;
  public status!: 'pending' | 'paid' | 'overdue' | 'cancelled';
  public type!: 'rent' | 'maintenance' | 'electricity' | 'water' | 'other';
  public description!: string;
  public lateFee!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Bill.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  unitId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'units',
      key: 'id',
    }
  },
  renterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'overdue', 'cancelled'),
    defaultValue: 'pending',
  },
  type: {
    type: DataTypes.ENUM('rent', 'maintenance', 'electricity', 'water', 'other'),
    defaultValue: 'rent',
  },
  description: {
    type: DataTypes.TEXT,
  },
  lateFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
}, {
  sequelize,
  modelName: 'Bill',
  tableName: 'bills',
  timestamps: true,
});

// 4. Maintenance Request Model (YOURS - Managers handle maintenance)
interface MaintenanceRequestAttributes {
  id: string;
  unitId: string;
  renterId: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  estimatedCost?: number;
  actualCost?: number;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class MaintenanceRequest extends Model<MaintenanceRequestAttributes> implements MaintenanceRequestAttributes {
  public id!: string;
  public unitId!: string;
  public renterId!: string;
  public title!: string;
  public description!: string;
  public priority!: 'low' | 'medium' | 'high' | 'urgent';
  public status!: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  public assignedTo!: string;
  public estimatedCost!: number;
  public actualCost!: number;
  public completedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MaintenanceRequest.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  unitId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'units',
      key: 'id',
    }
  },
  renterId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    }
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    defaultValue: 'medium',
  },
  status: {
    type: DataTypes.ENUM('pending', 'assigned', 'in_progress', 'completed', 'cancelled'),
    defaultValue: 'pending',
  },
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    }
  },
  estimatedCost: {
    type: DataTypes.DECIMAL(10, 2),
  },
  actualCost: {
    type: DataTypes.DECIMAL(10, 2),
  },
  completedAt: {
    type: DataTypes.DATE,
  },
}, {
  sequelize,
  modelName: 'MaintenanceRequest',
  tableName: 'maintenance_requests',
  timestamps: true,
});

// ==================== EXISTING MANAGER TASK MODEL ====================

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
  public createdAt!: Date;
  public updatedAt!: Date;
}

ManagerTask.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  managerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    }
  },
  taskType: {
    type: DataTypes.ENUM('bill_payment', 'complaint_resolution', 'renter_approval', 'payment_verification'),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  status: {
    type: DataTypes.ENUM('pending', 'in_progress', 'completed', 'overdue'),
    defaultValue: 'pending',
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
  },
  dueDate: {
    type: DataTypes.DATE,
  },
  completedAt: {
    type: DataTypes.DATE,
  },
}, {
  sequelize,
  modelName: 'ManagerTask',
  tableName: 'manager_tasks',
  timestamps: true,
});

// ==================== DEFINE RELATIONSHIPS (YOURS) ====================

// User (Manager) → Building (One-to-Many)
User.hasMany(Building, { foreignKey: 'managerId', as: 'managedBuildings' });
Building.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

// User (Owner) → Building (One-to-Many) - optional
User.hasMany(Building, { foreignKey: 'ownerId', as: 'ownedBuildings' });
Building.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// Building → Unit (One-to-Many)
Building.hasMany(Unit, { foreignKey: 'buildingId', as: 'units' });
Unit.belongsTo(Building, { foreignKey: 'buildingId', as: 'building' });

// User (Renter) → Unit (One-to-One)
User.hasOne(Unit, { foreignKey: 'renterId', as: 'rentedUnit' });
Unit.belongsTo(User, { foreignKey: 'renterId', as: 'renter' });

// Unit → Bill (One-to-Many)
Unit.hasMany(Bill, { foreignKey: 'unitId', as: 'bills' });
Bill.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });

// User (Renter) → Bill (One-to-Many)
User.hasMany(Bill, { foreignKey: 'renterId', as: 'renterBills' });
Bill.belongsTo(User, { foreignKey: 'renterId', as: 'renter' });

// Unit → MaintenanceRequest (One-to-Many)
Unit.hasMany(MaintenanceRequest, { foreignKey: 'unitId', as: 'maintenanceRequests' });
MaintenanceRequest.belongsTo(Unit, { foreignKey: 'unitId', as: 'unit' });

// User (Renter) → MaintenanceRequest (One-to-Many)
User.hasMany(MaintenanceRequest, { foreignKey: 'renterId', as: 'maintenanceRequests' });
MaintenanceRequest.belongsTo(User, { foreignKey: 'renterId', as: 'renter' });

// User (Manager) → ManagerTask (One-to-Many)
User.hasMany(ManagerTask, { foreignKey: 'managerId', as: 'tasks' });
ManagerTask.belongsTo(User, { foreignKey: 'managerId', as: 'manager' });

export { 
  sequelize, 
  User, 
  Building, 
  Unit, 
  Bill, 
  MaintenanceRequest,
  ManagerTask 
};