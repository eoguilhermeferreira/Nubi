import { transcribeAudioFn } from "./nubi-ai.functions";

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function transcribeRecording(audioBase64: string, mimeType: string): Promise<string> {
  const { text } = await transcribeAudioFn({ data: { audioBase64, mimeType } });
  return text;
}
