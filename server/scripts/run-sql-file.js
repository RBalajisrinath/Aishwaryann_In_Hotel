import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { config } from '../config/config.js';

// Load .env from the current working directory (run this script from the server folder)
dotenv.config();

const usage = `Usage: node scripts/run-sql-file.js <path-to-sql-file>
Example: node scripts/run-sql-file.js migrations/000-reset-rooms.sql`;

async function main() {
  try {
    const sqlArg = process.argv[2];
    if (!sqlArg) {
      console.error('Error: SQL file path required.');
      console.log(usage);
      process.exit(1);
    }

    const sqlPath = path.isAbsolute(sqlArg) ? sqlArg : path.resolve(process.cwd(), sqlArg);
    console.log('Running SQL file:', sqlPath);

    const sql = await fs.readFile(sqlPath, 'utf8');
    if (!sql || sql.trim().length === 0) {
      console.error('SQL file is empty');
      process.exit(1);
    }

    const dbConfig = {
      host: process.env.DB_HOST || config.db.host,
      user: process.env.DB_USER || config.db.user,
      password: process.env.DB_PASSWORD || config.db.password,
      database: process.env.DB_NAME || config.db.database,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
      multipleStatements: true,
    };

    console.log('Connecting to DB host:', dbConfig.host, 'database:', dbConfig.database, 'user:', dbConfig.user);

    const connection = await mysql.createConnection(dbConfig);
    try {
      const [results] = await connection.query(sql);
      console.log('SQL executed successfully');
      // If results is an array (multiple statements), print summary
      if (Array.isArray(results)) {
        console.log('Statements executed:', results.length);
      }
    } finally {
      await connection.end();
    }
  } catch (err) {
    console.error('Error running SQL file:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
