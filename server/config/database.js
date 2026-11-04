import mysql from 'mysql2/promise';
import { config } from './config.js';
import { initializeTables } from '../models/index.js';

let pool;

export const initializeDatabase = async () => {
  try {
    pool = mysql.createPool(config.db);
    
    // Test connection
    const connection = await pool.getConnection();
    connection.release();
    
    // Initialize tables
    await initializeTables();
    
    return pool;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    process.exit(1);
  }
};

export const getPool = () => {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return pool;
};

export const executeQuery = async (query, values = []) => {
  const connection = await pool.getConnection();
  try {
    const [results] = await connection.query(query, values);
    return results;
  } finally {
    connection.release();
  }
};

export const executeQueryWithConnection = async (connection, query, values = []) => {
  const [results] = await connection.query(query, values);
  return results;
};
