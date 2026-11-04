-- Migration: Create realtime_events table for storing DB-side event records
-- This table can be used by external workers or the server to read DB changes
-- and emit them to connected clients. This migration does NOT add triggers by default.

CREATE TABLE IF NOT EXISTS realtime_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tableName VARCHAR(100) NOT NULL,
  eventType ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  recordId INT NULL,
  recordUuid VARCHAR(36) NULL,
  payload JSON NULL,
  processed BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optionally add an index to speed up consumers querying unprocessed events
CREATE INDEX IF NOT EXISTS idx_realtime_events_processed_createdat ON realtime_events(processed, createdAt);
