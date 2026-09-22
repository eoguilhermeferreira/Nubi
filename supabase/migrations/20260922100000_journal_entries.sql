-- JOURNAL ENTRIES (diário pessoal, privado, sem participação da IA)
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX journal_entries_user_updated_idx ON public.journal_entries (user_id, updated_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "journal_entries_select_own" ON public.journal_entries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "journal_entries_insert_own" ON public.journal_entries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_entries_update_own" ON public.journal_entries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "journal_entries_delete_own" ON public.journal_entries
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER journal_entries_set_updated_at
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
