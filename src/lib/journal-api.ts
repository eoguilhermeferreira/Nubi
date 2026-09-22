import { supabase } from "@/integrations/supabase/client";
import type { JournalEntry } from "../types/journal";

export interface JournalEntryRow {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export const formatEntryDate = (iso: string): string => {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const time = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Hoje, ${time}`;
  const day = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  return `${day}, ${time}`;
};

export const entryPreview = (content: string): string => {
  const clean = content.trim().replace(/\s+/g, " ");
  if (!clean) return "Entrada em branco";
  return clean.length > 60 ? clean.slice(0, 60).trimEnd() + "..." : clean;
};

const mapEntry = (row: JournalEntryRow): JournalEntry => ({
  id: row.id,
  content: row.content,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export async function fetchJournalEntries(): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, content, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapEntry);
}

export async function createJournalEntry(userId: string, content: string): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({ user_id: userId, content })
    .select("id, content, created_at, updated_at")
    .single();
  if (error) throw error;
  return mapEntry(data);
}

export async function updateJournalEntry(id: string, content: string): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from("journal_entries")
    .update({ content })
    .eq("id", id)
    .select("id, content, created_at, updated_at")
    .single();
  if (error) throw error;
  return mapEntry(data);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const { error } = await supabase.from("journal_entries").delete().eq("id", id);
  if (error) throw error;
}
