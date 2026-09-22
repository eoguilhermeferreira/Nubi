import React, { useEffect, useRef, useState } from "react";
import { X, Mic, Square, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { blobToBase64, transcribeRecording } from "../lib/voice-input";
import { synthesizeSpeechFn } from "../lib/nubi-ai.functions";

type CallState = "idle" | "listening" | "thinking" | "speaking" | "error";

interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTurn: (transcript: string) => Promise<string>;
}

const STATE_LABEL: Record<CallState, string> = {
  idle: "Toque para falar",
  listening: "Ouvindo...",
  thinking: "Pensando...",
  speaking: "Falando...",
  error: "Algo deu errado, tente de novo",
};

export const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ isOpen, onClose, onTurn }) => {
  const [state, setState] = useState<CallState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopEverything = () => {
    mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    audioRef.current?.pause();
    audioRef.current = null;
  };

  useEffect(() => {
    if (!isOpen) {
      stopEverything();
      setState("idle");
    }
    return () => {
      if (!isOpen) return;
      stopEverything();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClose = () => {
    stopEverything();
    onClose();
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        await handleTurn(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setState("listening");
    } catch (err) {
      console.error("[nubi] erro ao acessar microfone:", err);
      toast.error("Não foi possível acessar o microfone");
      setState("error");
    }
  };

  const stopListening = () => {
    mediaRecorderRef.current?.stop();
  };

  const handleTurn = async (blob: Blob) => {
    setState("thinking");
    try {
      const audioBase64 = await blobToBase64(blob);
      const transcript = await transcribeRecording(audioBase64, blob.type);
      if (!transcript) {
        setState("idle");
        return;
      }

      const reply = await onTurn(transcript);

      const { audioBase64: replyAudioBase64, mimeType } = await synthesizeSpeechFn({
        data: { text: reply },
      });

      const bytes = Uint8Array.from(atob(replyAudioBase64), (c) => c.charCodeAt(0));
      const audioBlob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(audioBlob);

      const audio = new Audio(url);
      audioRef.current = audio;
      setState("speaking");
      audio.onended = () => {
        URL.revokeObjectURL(url);
        setState("idle");
      };
      await audio.play();
    } catch (err) {
      console.error("[nubi] erro na chamada de voz:", err);
      toast.error("Não foi possível continuar a conversa por voz");
      setState("error");
    }
  };

  const handleMicTap = () => {
    if (state === "listening") {
      stopListening();
    } else if (state === "idle" || state === "error") {
      void startListening();
    }
  };

  const isBusy = state === "thinking" || state === "speaking";

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050B14]/97 backdrop-blur-sm px-6">
      <button
        onClick={handleClose}
        aria-label="Encerrar conversa por voz"
        className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-100 hover:bg-[#0F1E36] transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex flex-col items-center gap-8">
        <button
          type="button"
          onClick={handleMicTap}
          disabled={isBusy}
          aria-label={state === "listening" ? "Parar de falar" : "Falar"}
          className={`
            w-28 h-28 rounded-full flex items-center justify-center transition-all duration-200
            ${
              state === "listening"
                ? "bg-red-500/20 border-2 border-red-400 scale-110"
                : state === "speaking"
                  ? "bg-blue-500/20 border-2 border-blue-400 animate-pulse"
                  : "bg-[#0A1424] border-2 border-[#0F1C30] hover:border-[#162D4A]"
            }
            ${isBusy ? "cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {state === "thinking" ? (
            <Loader2 className="w-9 h-9 text-slate-300 animate-spin" />
          ) : state === "listening" ? (
            <Square className="w-8 h-8 text-red-400" />
          ) : (
            <Mic className="w-9 h-9 text-slate-300" />
          )}
        </button>

        <p className="text-sm text-slate-400">{STATE_LABEL[state]}</p>
      </div>
    </div>
  );
};
