-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('follow','comment','reply','collab_invite','remix')),
  entity_id UUID,
  entity_type TEXT,
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifs_own_read" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifs_own_update" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifs_service_insert" ON notifications FOR INSERT WITH CHECK (true);

-- Auto-notify on follow
CREATE OR REPLACE FUNCTION notify_on_follow()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE actor_name TEXT;
BEGIN
  SELECT display_name INTO actor_name FROM profiles WHERE id = NEW.follower_id;
  INSERT INTO notifications (user_id, actor_id, type, entity_id, entity_type, message)
  VALUES (NEW.following_id, NEW.follower_id, 'follow', NEW.follower_id, 'profile',
    actor_name || ' started following you');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_new_follow ON follows;
CREATE TRIGGER on_new_follow AFTER INSERT ON follows FOR EACH ROW EXECUTE FUNCTION notify_on_follow();

-- Auto-notify on comment (notify video owner)
CREATE OR REPLACE FUNCTION notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE actor_name TEXT;
BEGIN
  SELECT display_name INTO actor_name FROM profiles WHERE id = NEW.user_id;
  INSERT INTO notifications (user_id, actor_id, type, entity_id, entity_type, message)
  SELECT p.id, NEW.user_id, 'comment', NEW.video_id, 'video',
    actor_name || ' commented on your video'
  FROM videos v
  JOIN profiles p ON v.creator_id = p.id
  WHERE v.id = NEW.video_id AND v.creator_id != NEW.user_id AND v.creator_id IS NOT NULL;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_new_comment ON comments;
CREATE TRIGGER on_new_comment AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION notify_on_comment();

-- DM conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  unread_1 INTEGER DEFAULT 0,
  unread_2 INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) <= 1000),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at ASC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_participants_read" ON conversations FOR SELECT
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "conv_participants_insert" ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "conv_participants_update" ON conversations FOR UPDATE
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
CREATE POLICY "msg_participants_read" ON messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid()))
  );
CREATE POLICY "msg_sender_insert" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);
