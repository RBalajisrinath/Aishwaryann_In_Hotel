import { initializeDatabase, executeQuery } from '../config/database.js';
import { config } from '../config/config.js';

const run = async () => {
  try {
    console.log('Using DB config:', { host: config.db.host, user: config.db.user, database: config.db.database });
    await initializeDatabase();
    console.log('✅ initializeDatabase() finished');

    // Check hotels count
    const hotels = await executeQuery('SELECT id, name, city, status FROM hotels LIMIT 20');
    console.log(`Hotels found: ${hotels.length}`);
    hotels.forEach(h => console.log(h));

    // Check rooms
    const rooms = await executeQuery('SELECT id, uuid, hotelId, type, pricePerNight, capacity, totalRooms, availableRooms FROM rooms LIMIT 50');
    console.log(`Rooms found: ${rooms.length}`);
    rooms.forEach(r => console.log(r));

    process.exit(0);
  } catch (err) {
    console.error('❌ check-db-and-rooms error:', err && err.message);
    if (err && err.stack) console.error(err.stack);
    process.exit(1);
  }
};

run();
