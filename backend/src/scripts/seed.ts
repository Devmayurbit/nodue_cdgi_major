import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

import User, { UserRole } from '../models/User';
import Department from '../models/Department';
import { config } from '../config';

const defaultDepartments = [
  { name: 'Computer Science & Engineering', code: 'CSE', description: 'Department of CSE' },
  { name: 'Electronics & Communication', code: 'ECE', description: 'Department of ECE' },
  { name: 'Mechanical Engineering', code: 'ME', description: 'Department of ME' },
  { name: 'Civil Engineering', code: 'CE', description: 'Department of CE' },
  { name: 'Electrical Engineering', code: 'EE', description: 'Department of EE' },
  { name: 'Information Technology', code: 'IT', description: 'Department of IT' },
  { name: 'Library', code: 'LIBRARY', description: 'Central Library' },
  { name: 'Accounts', code: 'ACCOUNTS', description: 'Accounts Department' },
  { name: 'Hostel', code: 'HOSTEL', description: 'Hostel Administration' },
  { name: 'Laboratory', code: 'LAB', description: 'Central Laboratory' },
];

const seed = async () => {
  try {
    await mongoose.connect(config.mongodb.uri);
    console.log('Connected to MongoDB for seeding...');

    // Seed Super Admin
    const existingSA = await User.findOne({ role: UserRole.SUPERADMIN });
    if (!existingSA) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(config.superAdmin.password, salt);

      await User.create({
        name: config.superAdmin.name,
        email: config.superAdmin.email,
        password: hashedPassword,
        role: UserRole.SUPERADMIN,
        department: 'Administration',
        isEmailVerified: true,
        accessKeyVerified: true,
        isActive: true,
      });
      console.log('✅ Super Admin created:', config.superAdmin.email);
    } else {
      console.log('ℹ️  Super Admin already exists.');
    }

    // Seed Departments
    for (const dept of defaultDepartments) {
      const existing = await Department.findOne({ code: dept.code });
      if (!existing) {
        await Department.create(dept);
        console.log(`✅ Department created: ${dept.name}`);
      }
    }

    console.log('\n🎉 Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
