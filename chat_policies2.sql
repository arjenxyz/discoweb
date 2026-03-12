-- ============================================================================
-- Row Level Security policies for chat schema (based on chat2.sql)
-- File: src/web/chat_policies2.sql
-- Purpose: conservative RLS rules that match the chat2.sql schema.
-- ============================================================================

-- Enable Row Level Security for core chat tables
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS message_edit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pinned_messages ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- rooms: allow selects only for members OR if room is persistent
-- ---------------------------------------------------------------------------
CREATE POLICY "select_rooms_if_member_or_persistent" ON rooms
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_members rm WHERE rm.room_id = rooms.id AND rm.user_id::text = auth.uid()::text
  ) OR rooms.is_persistent = true
);

-- Only the service role (or server-side RPCs) may create rooms directly.
CREATE POLICY "insert_rooms_service_only" ON rooms
FOR INSERT
TO anon, authenticated
WITH CHECK (auth.role() = 'service_role');

-- Allow owners/creators or service role to update room metadata
CREATE POLICY "update_rooms_owner_or_service" ON rooms
FOR UPDATE
USING (created_by::text = auth.uid()::text OR auth.role() = 'service_role')
WITH CHECK (created_by::text = auth.uid()::text OR auth.role() = 'service_role');

-- Deletions restricted to service role
CREATE POLICY "delete_rooms_service_only" ON rooms
FOR DELETE
USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- room_members: users can read their own membership rows; only service_role
-- may insert membership (server-managed). Owners/service may update.
-- ---------------------------------------------------------------------------
CREATE POLICY "select_room_members_for_self" ON room_members
FOR SELECT
USING (user_id::text = auth.uid()::text);

CREATE POLICY "insert_room_members_service_only" ON room_members
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "update_room_members_self_or_service" ON room_members
FOR UPDATE
USING (user_id::text = auth.uid()::text OR auth.role() = 'service_role')
WITH CHECK (user_id::text = auth.uid()::text OR auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- messages: members of a room may read messages; users may insert messages
-- only as themselves (sender_id == auth.uid()). Modifications are service-only.
-- ---------------------------------------------------------------------------
CREATE POLICY "select_messages_if_member" ON messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_members rm WHERE rm.room_id = messages.room_id AND rm.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "insert_own_messages" ON messages
FOR INSERT
WITH CHECK (sender_id::text = auth.uid()::text);

CREATE POLICY "update_messages_service_only" ON messages
FOR UPDATE
USING (auth.role() = 'service_role');

CREATE POLICY "delete_messages_service_only" ON messages
FOR DELETE
USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- message_reactions: allow selects for members, inserts by the reacting user
-- ---------------------------------------------------------------------------
CREATE POLICY "select_reactions_if_member" ON message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_members rm JOIN messages m ON m.room_id = rm.room_id
    WHERE rm.user_id::text = auth.uid()::text AND m.id = message_reactions.message_id
  )
);

CREATE POLICY "insert_reaction_by_user" ON message_reactions
FOR INSERT
WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "update_reactions_service_only" ON message_reactions
FOR UPDATE
USING (auth.role() = 'service_role');

CREATE POLICY "delete_reactions_service_only" ON message_reactions
FOR DELETE
USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- message_attachments & edit history & pinned_messages & typing_indicators
-- Basic policies: selects for members, modifications service-only or owner-only
-- ---------------------------------------------------------------------------
CREATE POLICY "select_attachments_if_member" ON message_attachments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages m JOIN room_members rm ON rm.room_id = m.room_id
    WHERE m.id = message_attachments.message_id AND rm.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "insert_attachments_service_only" ON message_attachments
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "update_attachments_service_only" ON message_attachments
FOR UPDATE
USING (auth.role() = 'service_role');

CREATE POLICY "delete_attachments_service_only" ON message_attachments
FOR DELETE
USING (auth.role() = 'service_role');

CREATE POLICY "select_message_edit_history_if_member" ON message_edit_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages m JOIN room_members rm ON rm.room_id = m.room_id
    WHERE m.id = message_edit_history.message_id AND rm.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "insert_message_edit_history_service_only" ON message_edit_history
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "update_message_edit_history_service_only" ON message_edit_history
FOR UPDATE
USING (auth.role() = 'service_role');

CREATE POLICY "delete_message_edit_history_service_only" ON message_edit_history
FOR DELETE
USING (auth.role() = 'service_role');

CREATE POLICY "select_pinned_messages_if_member" ON pinned_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_members rm WHERE rm.room_id = pinned_messages.room_id AND rm.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "insert_pinned_messages_service_only" ON pinned_messages
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "update_pinned_messages_service_only" ON pinned_messages
FOR UPDATE
USING (auth.role() = 'service_role');

CREATE POLICY "delete_pinned_messages_service_only" ON pinned_messages
FOR DELETE
USING (auth.role() = 'service_role');

CREATE POLICY "select_typing_indicators_if_member" ON typing_indicators
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM room_members rm WHERE rm.room_id = typing_indicators.room_id AND rm.user_id::text = auth.uid()::text
  )
);

CREATE POLICY "insert_typing_indicators_self_or_service" ON typing_indicators
FOR INSERT
WITH CHECK (user_id::text = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "update_typing_indicators_self_or_service" ON typing_indicators
FOR UPDATE
USING (user_id::text = auth.uid()::text OR auth.role() = 'service_role')
WITH CHECK (user_id::text = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "delete_typing_indicators_self_or_service" ON typing_indicators
FOR DELETE
USING (user_id::text = auth.uid()::text OR auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- users: allow users to select/update their own row; service role may upsert
-- ---------------------------------------------------------------------------
CREATE POLICY "select_own_user" ON users
FOR SELECT
USING (id::text = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "update_own_user" ON users
FOR UPDATE
USING (id::text = auth.uid()::text OR auth.role() = 'service_role')
WITH CHECK (id::text = auth.uid()::text OR auth.role() = 'service_role');

CREATE POLICY "insert_users_service_only" ON users
FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- Notes:
-- - These policies are intentionally conservative: create/insert/modify operations
--   for structural resources (rooms, membership, attachments) are restricted to
--   the service role. Normal users can insert their own messages and read rooms
--   they belong to; persistent rooms are visible to all authenticated users by
--   the rooms.is_persistent flag (see select_rooms_if_member_or_persistent).
-- - Adjust policies to your exact auth mapping (e.g. if `users.id` is not
--   equal to `auth.uid()` in your deployment, adapt the checks accordingly).
-- - To seed persistent rooms or add membership programmatically, call server
--   endpoints that use the SUPABASE_SERVICE_ROLE_KEY.
-- ============================================================================
