import { supabase } from "@/integrations/supabase/client";
import type { Attachment, Conversation, Message, MessageRole } from "../types/chat";

export interface ConversationRow {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: string;
  role: string;
  content: string;
  created_at: string;
  attachments: unknown;
}

function parseAttachments(raw: unknown): Attachment[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (item): item is Attachment =>
      !!item && typeof item === "object" && typeof (item as Attachment).path === "string",
  );
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export const mapConversation = (row: ConversationRow): Conversation => ({
  id: row.id,
  title: row.title,
  createdAt: formatTime(row.created_at),
  messages: [],
});

export const mapMessage = (row: MessageRow): Message => ({
  id: row.id,
  role: (row.role === "assistant" ? "assistant" : "user") as MessageRole,
  content: row.content,
  createdAt: formatTime(row.created_at),
  attachments: parseAttachments(row.attachments),
});

export const buildTitle = (text: string): string => {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "Nova conversa";
  return clean.length > 56 ? clean.slice(0, 56).trimEnd() + "..." : clean;
};

export async function fetchConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id, title, created_at, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapConversation);
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, created_at, attachments")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapMessage);
}

export async function createConversation(userId: string, title: string): Promise<Conversation> {
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_id: userId, title })
    .select("id, title, created_at, updated_at")
    .single();
  if (error) throw error;
  return mapConversation(data);
}

export async function insertMessage(params: {
  conversationId: string;
  userId: string;
  role: MessageRole;
  content: string;
  attachments?: Attachment[] | undefined;
}): Promise<Message> {
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: params.conversationId,
      user_id: params.userId,
      role: params.role,
      content: params.content,
      attachments: params.attachments ?? [],
    })
    .select("id, role, content, created_at, attachments")
    .single();
  if (error) throw error;
  return mapMessage(data);
}

export async function renameConversation(id: string, title: string) {
  const { error } = await supabase.from("conversations").update({ title }).eq("id", id);
  if (error) throw error;
}

export async function deleteConversation(id: string) {
  const { error } = await supabase.from("conversations").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteConversationMessages(conversationId: string) {
  const { error } = await supabase.from("messages").delete().eq("conversation_id", conversationId);
  if (error) throw error;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
