-- Chat schema for Supabase/Postgres
-- Tables: rooms, room_members, messages
-- Features:
-- - Direct message rooms between two users (unique pair)
-- - Group/persistent rooms (admin/dev help rooms)
-- - Messages table with metadata and indexed for realtime
-- - Helper function to create/find DM room by two discord IDs

-- rooms: represents a chat room (dm, group, help)
CREATE TABLE IF NOT EXISTS rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_type text NOT NULL CHECK (room_type IN ('dm','group','help')),
  name text,
  is_persistent boolean DEFAULT false NOT NULL, -- admin/dev help rooms set true
  created_at timestamptz DEFAULT now() NOT NULL,
  last_message_at timestamptz
);

-- room_members: membership mapping
CREATE TABLE IF NOT EXISTS room_members (
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id text NOT NULL, -- store Discord user id as text
  joined_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (room_id, user_id)
);

-- messages: message history
CREATE TABLE IF NOT EXISTS messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  sender_id text NOT NULL, -- discord user id of sender
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes to help realtime and queries
CREATE INDEX IF NOT EXISTS idx_messages_room_id_created_at ON messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON room_members(user_id);

-- Convenience: unique DM room between two users (order-invariant)
-- We'll store pair_key as smallestid|largestid to enforce uniqueness for 1:1 rooms
ALTER TABLE IF EXISTS rooms DROP COLUMN IF EXISTS pair_key;
ALTER TABLE IF EXISTS rooms ADD COLUMN IF NOT EXISTS pair_key text;
CREATE UNIQUE INDEX IF NOT EXISTS ux_rooms_pair_key ON rooms(pair_key) WHERE room_type = 'dm';

-- Function to find or create a DM room between two discord user ids
CREATE OR REPLACE FUNCTION get_or_create_dm_room(uid_a text, uid_b text)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  a text := LEAST(uid_a, uid_b);
  b text := GREATEST(uid_a, uid_b);
  key text := a || '|' || b;
  rid uuid;
BEGIN
  SELECT id INTO rid FROM rooms WHERE pair_key = key LIMIT 1;
  IF rid IS NOT NULL THEN
    RETURN rid;
  END IF;

  INSERT INTO rooms (room_type, name, is_persistent, pair_key)
  VALUES ('dm', NULL, false, key)
  RETURNING id INTO rid;

  INSERT INTO room_members (room_id, user_id) VALUES (rid, a) ON CONFLICT DO NOTHING;
  INSERT INTO room_members (room_id, user_id) VALUES (rid, b) ON CONFLICT DO NOTHING;

  RETURN rid;
END;
$$;

-- Trigger to update room.last_message_at when new message inserted
CREATE OR REPLACE FUNCTION touch_room_last_message()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE rooms SET last_message_at = NEW.created_at WHERE id = NEW.room_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_room_last_message ON messages;
CREATE TRIGGER trg_touch_room_last_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION touch_room_last_message();

-- Seed persistent admin and developer help rooms (idempotent)
INSERT INTO rooms (room_type, name, is_persistent)
SELECT 'help', 'Admin Help', true
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_type = 'help' AND name = 'Admin Help');

INSERT INTO rooms (room_type, name, is_persistent)
SELECT 'help', 'Developer Help', true
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE room_type = 'help' AND name = 'Developer Help');

-- Optional: materialized view or function to search users by discord id in messages/room_members
-- Create a helper view listing distinct user ids seen in messages and room_members
CREATE OR REPLACE VIEW known_users AS
SELECT user_id FROM room_members
UNION
SELECT sender_id AS user_id FROM messages;

-- Grant minimal privileges examples (adjust for your Supabase policies)
-- GRANT SELECT, INSERT, UPDATE ON messages TO anon, authenticated;
-- GRANT SELECT ON rooms, room_members TO anon, authenticated;

-- End of schema
