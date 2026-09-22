-- MESSAGE ATTACHMENTS
ALTER TABLE public.messages
  ADD COLUMN attachments JSONB NOT NULL DEFAULT '[]'::jsonb;

-- STORAGE BUCKET (privado — arquivos só acessíveis via URL assinada ou pela service_role)
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Cada usuário só acessa arquivos dentro da própria pasta: chat-attachments/<user_id>/...
CREATE POLICY "chat_attachments_select_own" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'chat-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "chat_attachments_insert_own" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'chat-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "chat_attachments_delete_own" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'chat-attachments'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
