import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import readline from 'readline';
import { config } from '../config/config.js';
import crypto from 'crypto';

dotenv.config();

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    if (hidden) {
      // hide input by muting output
      const stdin = process.stdin;
      const onDataHandler = (char) => {
        char = char + '';
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004':
            stdin.pause();
            break;
          default:
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(question + Array(rl.line.length + 1).join('*'));
            break;
        }
      };
      process.stdin.on('data', onDataHandler);
      rl.question(question, (answer) => {
        process.stdin.removeListener('data', onDataHandler);
        rl.close();
        process.stdout.write('\n');
        resolve(answer);
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

async function main() {
  try {
    const emailArgIndex = process.argv.indexOf('--email');
    const email = emailArgIndex !== -1 ? process.argv[emailArgIndex + 1] : null;

    let targetEmail = email;
    if (!targetEmail) {
      targetEmail = await ask('Admin email to reset (default from .env ADMIN_EMAIL): ');
      if (!targetEmail) {
        targetEmail = process.env.ADMIN_EMAIL;
      }
    }

    if (!targetEmail) {
      console.error('No admin email provided and ADMIN_EMAIL not set in .env');
      process.exit(1);
    }

    const pwdArgIndex = process.argv.indexOf('--password');
    let password = pwdArgIndex !== -1 ? process.argv[pwdArgIndex + 1] : null;
    if (!password) {
      password = await ask('New password: ', true);
      const passwordConfirm = await ask('Confirm password: ', true);
      if (password !== passwordConfirm) {
        console.error('Passwords do not match');
        process.exit(1);
      }
    }

    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);

    const dbConfig = {
      host: process.env.DB_HOST || config.db.host,
      user: process.env.DB_USER || config.db.user,
      password: process.env.DB_PASSWORD || config.db.password,
      database: process.env.DB_NAME || config.db.database,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    };

    console.log('Connecting to DB:', dbConfig.host, dbConfig.database, 'as', dbConfig.user);
    const connection = await mysql.createConnection(dbConfig);
    try {
      const [existing] = await connection.query('SELECT id, email FROM users WHERE email = ? LIMIT 1', [targetEmail]);
      if (!existing || existing.length === 0) {
        // Create new admin user
  const uuid = crypto.randomUUID();
        const [res] = await connection.query(
          'INSERT INTO users (uuid, firstName, lastName, email, password, role, status, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
          [uuid, 'Admin', 'User', targetEmail, hashed, 'super-admin', 'active', true]
        );
        console.log('Created new admin user with id:', res.insertId, 'email:', targetEmail);
      } else {
        // Update existing
        const [res] = await connection.query('UPDATE users SET password = ? WHERE email = ?', [hashed, targetEmail]);
        console.log('Updated password for admin email:', targetEmail);
      }
    } finally {
      await connection.end();
    }

    console.log('Done. Use the new credentials to sign in.');
  } catch (err) {
    console.error('Error resetting admin password:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
