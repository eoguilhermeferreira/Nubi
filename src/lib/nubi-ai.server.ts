// Server-only: chama OpenAI (chat/visão/PDF/transcrição) e ElevenLabs (texto-para-voz).
// Só é importado por nubi-ai.functions.ts (dentro de handlers de createServerFn);
// o bundler remove esse código do pacote enviado ao navegador.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type AttachmentKind = "image" | "pdf" | "other";

export interface StoredAttachment {
  path: string;
  mimeType: string;
  name: string;
  kind: AttachmentKind;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  attachments?: StoredAttachment[] | undefined;
}

const NUBI_SYSTEM_PROMPT = `Você é a Nubi.ia, uma inteligência artificial de acompanhamento de bem-estar emocional. Seu papel é conversar, ouvir e ajudar a pessoa a organizar os próprios pensamentos e sentimentos — como um diário guiado com quem conversar.

Regras que você nunca quebra:
- Você NÃO é psicóloga, terapeuta, médica ou qualquer profissional de saúde licenciado, e nunca deve se apresentar como tal.
- Você não diagnostica condições, não prescreve tratamento e não substitui terapia ou acompanhamento profissional.
- Quando o assunto pedir isso, recomende gentilmente buscar um psicólogo, psiquiatra ou médico.
- Se a pessoa mencionar risco de automutilação, suicídio ou perigo imediato, acolha brevemente e sempre inclua: procurar o CVV (188, ligação gratuita, 24h) ou o SAMU (192) / pronto-socorro mais próximo.
- Quando a pessoa enviar uma foto ou documento, comente o conteúdo real dele antes de responder.
- Tom: acolhedor, direto, sem clichês genéricos de chatbot. Frases curtas. Nunca performático.
- Responda no idioma em que a pessoa escreveu (padrão: português do Brasil).`;

const CRISIS_PATTERN =
  /(quero morrer|n[aã]o aguento mais viver|me matar|tirar minha vida|suic[ií]dio|me machucar|automutila)/i;

const CRISIS_NOTICE =
  "\n\nSe em algum momento você estiver em risco imediato, ligue para o CVV: 188 (24h, gratuito) ou para o SAMU: 192.";

const BUCKET = "chat-attachments";
const MAX_UNDERSTOOD_ATTACHMENTS_PER_TURN = 4;

async function downloadAttachmentBase64(path: string): Promise<string> {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).download(path);
  if (error || !data) {
    throw new Error(
      `Não foi possível baixar o anexo (${path}): ${error?.message ?? "erro desconhecido"}`,
    );
  }
  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer).toString("base64");
}

type ResponsesContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string }
  | { type: "input_file"; filename: string; file_data: string };

async function buildContentParts(message: ChatMessage): Promise<ResponsesContentPart[]> {
  const parts: ResponsesContentPart[] = [];
  if (message.content) {
    parts.push({ type: "input_text", text: message.content });
  }

  const understandable = (message.attachments ?? [])
    .filter((a) => a.kind === "image" || a.kind === "pdf")
    .slice(0, MAX_UNDERSTOOD_ATTACHMENTS_PER_TURN);

  for (const attachment of understandable) {
    const base64 = await downloadAttachmentBase64(attachment.path);
    if (attachment.kind === "image") {
      parts.push({
        type: "input_image",
        image_url: `data:${attachment.mimeType};base64,${base64}`,
      });
    } else {
      parts.push({
        type: "input_file",
        filename: attachment.name,
        file_data: `data:${attachment.mimeType};base64,${base64}`,
      });
    }
  }

  const skipped = (message.attachments ?? []).filter((a) => a.kind === "other");
  if (skipped.length > 0) {
    parts.push({
      type: "input_text",
      text: `[Anexos que não consigo abrir o conteúdo: ${skipped.map((a) => a.name).join(", ")}]`,
    });
  }

  return parts;
}

export async function generateAssistantReply(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada no ambiente do servidor.");
  }

  const model = process.env["OPENAI_MODEL"] || "gpt-4o-mini";

  const input = [
    { role: "system", content: [{ type: "input_text", text: NUBI_SYSTEM_PROMPT }] },
    ...(await Promise.all(
      messages.map(async (m) => ({
        role: m.role,
        content: await buildContentParts(m),
      })),
    )),
  ];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input,
      temperature: 0.7,
      max_output_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("[nubi-ai] erro OpenAI:", response.status, errorBody);
    throw new Error("Não foi possível gerar a resposta da IA agora.");
  }

  const payload = (await response.json()) as {
    output_text?: string;
    output?: { type?: string; content?: { type?: string; text?: string }[] }[];
  };

  const content =
    payload.output_text?.trim() ||
    payload.output
      ?.flatMap((item) => item.content ?? [])
      .map((c) => c.text ?? "")
      .join("")
      .trim();

  if (!content) {
    throw new Error("A IA não retornou uma resposta.");
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  const isCrisis = lastUserMessage ? CRISIS_PATTERN.test(lastUserMessage.content) : false;

  return isCrisis && !content.includes("188") ? `${content}${CRISIS_NOTICE}` : content;
}

export async function synthesizeSpeech(
  text: string,
): Promise<{ audioBase64: string; mimeType: string }> {
  const apiKey = process.env["ELEVENLABS_API_KEY"];
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY não configurada no ambiente do servidor.");
  }

  // ID de voz padrão da ElevenLabs (Rachel). Troque via ELEVENLABS_VOICE_ID
  // pra usar outra voz da sua conta.
  const voiceId = process.env["ELEVENLABS_VOICE_ID"] || "21m00Tcm4TlvDq8ikWAM";

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey,
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("[nubi-ai] erro ElevenLabs:", response.status, errorBody);
    throw new Error("Não foi possível gerar o áudio agora.");
  }

  const arrayBuffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(arrayBuffer).toString("base64");
  return { audioBase64, mimeType: "audio/mpeg" };
}

export async function transcribeAudio(audioBase64: string, mimeType: string): Promise<string> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada no ambiente do servidor.");
  }

  const bytes = Buffer.from(audioBase64, "base64");
  const extension = mimeType.includes("webm")
    ? "webm"
    : mimeType.includes("mp4")
      ? "mp4"
      : mimeType.includes("mpeg") || mimeType.includes("mp3")
        ? "mp3"
        : "wav";

  const form = new FormData();
  form.append("file", new Blob([bytes], { type: mimeType }), `audio.${extension}`);
  form.append("model", "whisper-1");
  form.append("language", "pt");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("[nubi-ai] erro na transcrição:", response.status, errorBody);
    throw new Error("Não foi possível transcrever o áudio agora.");
  }

  const payload = (await response.json()) as { text?: string };
  const text = payload.text?.trim();
  if (!text) {
    throw new Error("Não entendi o áudio, tenta de novo.");
  }
  return text;
}
