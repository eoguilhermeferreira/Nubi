import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateAssistantReply, synthesizeSpeech, transcribeAudio } from "./nubi-ai.server";

const attachmentSchema = z.object({
  path: z.string().min(1),
  mimeType: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["image", "pdf", "other"]),
});

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(4000),
  attachments: z.array(attachmentSchema).max(4).optional(),
});

const generateReplyInput = z.object({
  messages: z.array(chatMessageSchema).min(1).max(40),
});

export const generateAssistantReplyFn = createServerFn({ method: "POST" })
  .validator(generateReplyInput)
  .handler(async ({ data }) => {
    const content = await generateAssistantReply(data.messages);
    return { content };
  });

const synthesizeSpeechInput = z.object({
  text: z.string().min(1).max(2000),
});

export const synthesizeSpeechFn = createServerFn({ method: "POST" })
  .validator(synthesizeSpeechInput)
  .handler(async ({ data }) => {
    return synthesizeSpeech(data.text);
  });

const transcribeAudioInput = z.object({
  audioBase64: z.string().min(1),
  mimeType: z.string().min(1),
});

export const transcribeAudioFn = createServerFn({ method: "POST" })
  .validator(transcribeAudioInput)
  .handler(async ({ data }) => {
    const text = await transcribeAudio(data.audioBase64, data.mimeType);
    return { text };
  });
