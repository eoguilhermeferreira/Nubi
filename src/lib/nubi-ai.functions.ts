import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateAssistantReply, synthesizeSpeech } from "./nubi-ai.server";

const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
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
