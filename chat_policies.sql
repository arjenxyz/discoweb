-- Example Supabase RLS policies for chat schema
-- Adjust role names and functions to match your Supabase setup.

-- Enable Row Level Security
ALTER TABLE IF EXISTS rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to select rooms they are a member of
CREATE POLICY "select_rooms_if_member" ON rooms
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_members rm WHERE rm.room_id = rooms.id AND rm.user_id = auth.uid()
  ) OR rooms.is_persistent = true
);

-- Policy: allow inserting rooms only by server-side service role (or via RPC)
CREATE POLICY "insert_rooms_service_only" ON rooms
FOR INSERT
TO anon, authenticated
USING (false)
WITH CHECK (auth.role() = 'service_role');

-- Allow users to read their room_members rows
CREATE POLICY "select_room_members_for_self" ON room_members
FOR SELECT
USING (user_id = auth.uid());

-- Allow inserting membership by service role or via trusted RPC
CREATE POLICY "insert_room_members_service" ON room_members
FOR INSERT
USING (auth.role() = 'service_role');

-- Messages: allow select if user is member of the room
CREATE POLICY "select_messages_if_member" ON messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_members rm WHERE rm.room_id = messages.room_id AND rm.user_id = auth.uid()
  )
);

-- Messages: allow insert if sender_id == auth.uid()
CREATE POLICY "insert_own_messages" ON messages
FOR INSERT
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Messages: allow delete/update only by service_role
CREATE POLICY "mod_messages_service_only" ON messages
FOR UPDATE, DELETE
USING (auth.role() = 'service_role');

-- Notes:
-- - `auth.uid()` returns the current authenticated user identifier in Supabase.
-- - In many deployments, you will perform sensitive operations (e.g. creating persistent rooms,
--   adding members) from a server-side function using the SUPABASE_SERVICE_ROLE_KEY; these policies
--   deliberately restrict such operations to the service role and allow normal users to only insert their own messages and read rooms they belong to.
-- - Adjust policies and add more selective rules for admin/developer persistent rooms as needed.
