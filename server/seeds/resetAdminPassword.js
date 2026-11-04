import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const resetAdminPassword = async () => {
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

    // Hash password
    const newPassword = 'Aishwaryaminn@2025';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin password
    const [result] = await connection.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, process.env.ADMIN_EMAIL]
    );

    if (result.affectedRows > 0) {
      console.log('✓ Admin password reset successfully');
      console.log('');
      console.log('Admin Credentials:');
      console.log('─'.repeat(50));
      console.log(`Email:    ${process.env.ADMIN_EMAIL}`);
      console.log(`Password: ${newPassword}`);
      console.log('─'.repeat(50));
      console.log('');
      console.log('Try logging in now at: http://localhost:3001/admin/login');
      console.log('');
    } else {
      console.log('⚠ Admin user not found');
    }

    await connection.end();
  } catch (error) {
    console.error('✗ Error resetting password:', error.message);
    process.exit(1);
  }
};

resetAdminPassword();
