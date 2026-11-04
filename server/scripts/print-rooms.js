import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { config } from '../config/config.js';

dotenv.config();

async function main() {
  try {
    const dbConfig = {
      host: process.env.DB_HOST || config.db.host,
      user: process.env.DB_USER || config.db.user,
      password: process.env.DB_PASSWORD || config.db.password,
      database: process.env.DB_NAME || config.db.database,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    };

    const connection = await mysql.createConnection(dbConfig);
    try {
      const [rows] = await connection.query('SELECT id, hotelId, type, pricePerNight, capacity, totalRooms, availableRooms, extraAdultCharge FROM rooms ORDER BY hotelId, type');
      console.log('Rooms:');
      if (!rows || rows.length === 0) {
        console.log('  (no rows)');
      } else {
        rows.forEach(r => console.log(`  id=${r.id} hotelId=${r.hotelId} type=${r.type} price=${r.pricePerNight} cap=${r.capacity} total=${r.totalRooms} available=${r.availableRooms} extraAdult=${r.extraAdultCharge}`));
      }
    } finally {
      await connection.end();
    }
  } catch (err) {
    console.error('Error reading rooms:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
