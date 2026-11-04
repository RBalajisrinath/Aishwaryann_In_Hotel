import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const seedAdminUser = async () => {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log('✓ Connected to database');

    // Check if admin already exists
    const [existingAdmin] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [process.env.ADMIN_EMAIL]
    );

    if (existingAdmin.length > 0) {
      console.log(`⚠ Admin user already exists: ${process.env.ADMIN_EMAIL}`);
      await connection.end();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('Aishwaryaminn@2025', 10);

    // Generate UUID
    const uuid = uuidv4();

    // Insert admin user
    const [result] = await connection.execute(
      `INSERT INTO users (uuid, firstName, lastName, email, password, phone, role, status, emailVerified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid,
        'Aishwaryam',
        'Inn',
        process.env.ADMIN_EMAIL,
        hashedPassword,
        '+91-9876543210',
        'super-admin',
        'active',
        true
      ]
    );

    console.log('✓ Admin user created successfully');
    console.log('');
    console.log('Admin Credentials:');
    console.log('─'.repeat(50));
    console.log(`Email:    ${process.env.ADMIN_EMAIL}`);
    console.log(`Password: Aishwaryaminn@2025`);
    console.log('─'.repeat(50));
    console.log('');
    console.log('Login URL: http://localhost:3001/admin/login');
    console.log('');

    await connection.end();
  } catch (error) {
    console.error('✗ Error seeding admin user:', error.message);
    process.exit(1);
  }
};

seedAdminUser();
