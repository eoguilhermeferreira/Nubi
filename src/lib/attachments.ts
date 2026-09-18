import { supabase } from "@/integrations/supabase/client";
import type { Attachment, AttachmentKind } from "../types/chat";

const BUCKET = "chat-attachments";

export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024; // 15 MB

const ACCEPTED_MIME_PREFIXES = ["image/"];
const ACCEPTED_MIME_TYPES = ["application/pdf"];

export function isAttachmentTypeAccepted(mimeType: string): boolean {
  return (
    ACCEPTED_MIME_PREFIXES.some((prefix) => mimeType.startsWith(prefix)) ||
    ACCEPTED_MIME_TYPES.includes(mimeType)
  );
}

function classifyKind(mimeType: string): AttachmentKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType === "application/pdf") return "pdf";
  return "other";
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.-]+/g, "_").slice(-100);
}

export async function uploadAttachment(
  userId: string,
  conversationId: string,
  file: File,
): Promise<Attachment> {
  const id = crypto.randomUUID();
  const path = `${userId}/${conversationId}/${id}-${sanitizeFileName(file.name)}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw error;

  return {
    id,
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    path,
    kind: classifyKind(file.type),
  };
}

export async function removeAttachment(attachment: Attachment): Promise<void> {
  await supabase.storage.from(BUCKET).remove([attachment.path]);
}

export async function getAttachmentSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
  if (error || !data) return null;
  return data.signedUrl;
}

export function formatAttachmentSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
