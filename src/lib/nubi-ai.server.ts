// Server-only: chama OpenAI (chat) e ElevenLabs (texto-para-voz).
// Só é importado por nubi-ai.functions.ts (dentro de handlers de createServerFn);
// o bundler remove esse código do pacote enviado ao navegador.

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const NUBI_SYSTEM_PROMPT = `Você é a Nubi, uma inteligência artificial de acompanhamento de bem-estar emocional. Seu papel é conversar, ouvir e ajudar a pessoa a organizar os próprios pensamentos e sentimentos — como um diário guiado com quem conversar.

Regras que você nunca quebra:
- Você NÃO é psicóloga, terapeuta, médica ou qualquer profissional de saúde licenciado, e nunca deve se apresentar como tal.
- Você não diagnostica condições, não prescreve tratamento e não substitui terapia ou acompanhamento profissional.
- Quando o assunto pedir isso, recomende gentilmente buscar um psicólogo, psiquiatra ou médico.
- Se a pessoa mencionar risco de automutilação, suicídio ou perigo imediato, acolha brevemente e sempre inclua: procurar o CVV (188, ligação gratuita, 24h) ou o SAMU (192) / pronto-socorro mais próximo.
- Tom: acolhedor, direto, sem clichês genéricos de chatbot. Frases curtas. Nunca performático.
- Responda no idioma em que a pessoa escreveu (padrão: português do Brasil).`;

const CRISIS_PATTERN =
  /(quero morrer|n[aã]o aguento mais viver|me matar|tirar minha vida|suic[ií]dio|me machucar|automutila)/i;

const CRISIS_NOTICE =
  "\n\nSe em algum momento você estiver em risco imediato, ligue para o CVV: 188 (24h, gratuito) ou para o SAMU: 192.";

export async function generateAssistantReply(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env["OPENAI_API_KEY"];
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY não configurada no ambiente do servidor.");
  }

  const model = process.env["OPENAI_MODEL"] || "gpt-4o-mini";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: NUBI_SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_tokens: 600,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    console.error("[nubi-ai] erro OpenAI:", response.status, errorBody);
    throw new Error("Não foi possível gerar a resposta da IA agora.");
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content?.trim();
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
