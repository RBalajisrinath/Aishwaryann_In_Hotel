import { executeQuery } from '../config/database.js';

let running = false;

export const startDbEventConsumer = (io, pollInterval = 2000) => {
  if (running) return;
  running = true;

  const processEvents = async () => {
    try {
      // Query unprocessed events from db_events table
      const events = await executeQuery(
        'SELECT * FROM db_events WHERE processed = FALSE ORDER BY createdAt LIMIT 50'
      );

      if (events && events.length > 0) {
        // Events found for processing
      }

      for (const ev of events) {
        try {
          const table = ev.tableName;
          const action = ev.action; // 'INSERT', 'UPDATE', or 'DELETE'
          let payload = ev.newValues || {};

          // Parse JSON if it's a string
          if (typeof payload === 'string') {
            try {
              payload = JSON.parse(payload);
            } catch (e) {
              console.warn(`⚠️ Could not parse newValues JSON for event ${ev.id}`);
            }
          }

          // Emit specific events based on table and action
          if (!io) {
            console.warn('⚠️ Socket.io instance not available');
            continue;
          }

          const eventName = `${table}:${action.toLowerCase()}`;

          // Table-specific event handling
          if (table === 'rooms') {
            if (action === 'INSERT') io.emit('roomAdded', { ...payload, id: ev.recordId, hotelId: ev.hotelId });
            else if (action === 'UPDATE') io.emit('roomUpdated', { ...payload, id: ev.recordId, hotelId: ev.hotelId });
            else if (action === 'DELETE') io.emit('roomDeleted', { recordId: ev.recordId, hotelId: ev.hotelId });
          } else if (table === 'bookings') {
            if (action === 'INSERT') io.emit('bookingCreated', { ...payload, id: ev.recordId, hotelId: ev.hotelId });
            else if (action === 'UPDATE') io.emit('bookingUpdated', { ...payload, id: ev.recordId, hotelId: ev.hotelId });
            else if (action === 'DELETE') io.emit('bookingDeleted', { recordId: ev.recordId, hotelId: ev.hotelId });
          } else if (table === 'payment_settings') {
            if (action === 'UPDATE') {
              io.emit('paymentSettingsUpdated', { ...payload, hotelId: ev.hotelId });
            }
          } else {
            // Generic event for other tables
            io.emit(eventName, { ...payload, recordId: ev.recordId, hotelId: ev.hotelId });
          }
        } catch (emitErr) {
          console.error(`❌ Error emitting event ${ev.id}:`, emitErr?.message);
        }

        // Mark event as processed
        try {
          await executeQuery(
            'UPDATE db_events SET processed = TRUE, processedAt = NOW() WHERE id = ?',
            [ev.id]
          );
        } catch (markErr) {
          console.error(`❌ Failed to mark event ${ev.id} as processed:`, markErr?.message);
        }
      }
    } catch (err) {
      console.error('❌ dbEventConsumer error:', err?.message);
    } finally {
      if (running) {
        setTimeout(processEvents, pollInterval);
      }
    }
  };

  // Start polling
  processEvents();
};

export const stopDbEventConsumer = () => { running = false; };
