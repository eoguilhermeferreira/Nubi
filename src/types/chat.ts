export type MessageRole = "user" | "assistant";

export type AttachmentKind = "image" | "pdf" | "other";

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  path: string;
  kind: AttachmentKind;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  attachments?: Attachment[] | undefined;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  model?: string;
  pinned?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarText: string;
  plan: string;
}

export interface PromptSuggestion {
  id: string;
  title: string;
  subtitle: string;
  prompt: string;
  iconName: "lightbulb" | "compass" | "code" | "pen";
}
