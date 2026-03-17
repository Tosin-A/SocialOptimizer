-- Coach conversations & messages (persistent chat history)

CREATE TABLE IF NOT EXISTS coach_conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id  UUID REFERENCES connected_accounts(id) ON DELETE SET NULL,
  title       TEXT NOT NULL DEFAULT 'New conversation',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER set_coach_conversations_updated_at
  BEFORE UPDATE ON coach_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE coach_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_coach_conversations" ON coach_conversations
  FOR ALL USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE TABLE IF NOT EXISTS coach_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES coach_conversations(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content         TEXT NOT NULL,
  provider        TEXT NOT NULL DEFAULT 'claude',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE coach_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_coach_messages" ON coach_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM coach_conversations
      WHERE user_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    )
  );

CREATE INDEX idx_coach_conversations_user_id ON coach_conversations(user_id);
CREATE INDEX idx_coach_messages_conversation_id ON coach_messages(conversation_id);
