import React, { useEffect, useRef, useState } from "react";
import { Attachment, Message } from "../types/chat";
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Volume2,
  Square,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { synthesizeSpeechFn } from "../lib/nubi-ai.functions";
import { formatAttachmentSize, getAttachmentSignedUrl } from "../lib/attachments";

const AttachmentPreview: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (attachment.kind === "image") {
      void getAttachmentSignedUrl(attachment.path).then((signed) => {
        if (!cancelled) setUrl(signed);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [attachment.path, attachment.kind]);

  if (attachment.kind === "image") {
    return url ? (
      <img
        src={url}
        alt={attachment.name}
        className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-[#0F1C30]"
      />
    ) : (
      <div className="w-[120px] h-[80px] rounded-lg bg-[#050B14] animate-pulse" />
    );
  }

  return (
    <div className="flex items-center gap-1.5 bg-[#091322] px-2 py-1 rounded text-xs text-slate-300">
      <FileText className="w-3.5 h-3.5 text-slate-400" />
      <span>{attachment.name}</span>
      <span className="text-slate-500">{formatAttachmentSize(attachment.size)}</span>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: (() => void) | undefined;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [audioState, setAudioState] = useState<"idle" | "loading" | "playing">("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    };
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (type: "up" | "down") => {
    setFeedback(feedback === type ? null : type);
  };

  const handleToggleSpeech = async () => {
    if (audioState === "playing") {
      audioRef.current?.pause();
      setAudioState("idle");
      return;
    }
    if (audioState === "loading") return;

    setAudioState("loading");
    try {
      const { audioBase64, mimeType } = await synthesizeSpeechFn({
        data: { text: message.content },
      });

      const byteChars = atob(audioBase64);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType });

      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const url = URL.createObjectURL(blob);
      audioUrlRef.current = url;

      const audio = audioRef.current ?? new Audio();
      audio.src = url;
      audio.onended = () => setAudioState("idle");
      audioRef.current = audio;
      await audio.play();
      setAudioState("playing");
    } catch (err) {
      console.error("[nubi] erro ao gerar áudio:", err);
      toast.error("Não foi possível gerar o áudio");
      setAudioState("idle");
    }
  };

  return (
    <div
      className={`
        flex gap-3 max-w-2xl w-full mx-auto my-3 px-2 sm:px-4 group text-xs sm:text-sm
        ${isUser ? "justify-end" : "justify-start"}
      `}
    >
      {/* Nubi Icon */}
      {!isUser && (
        <div className="w-6 h-6 rounded bg-[#0A1424] text-slate-400 font-semibold flex items-center justify-center shrink-0 text-[11px] mt-0.5 border border-[#0F1C30]">
          N
        </div>
      )}

      <div className={`flex flex-col max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Role & Time */}
        <div className="text-[11px] text-slate-500 mb-1 px-0.5">{isUser ? "Você" : "Nubi.ia"}</div>

        {/* Message Bubble Body */}
        <div
          className={`
            p-3 rounded-lg leading-relaxed whitespace-pre-wrap break-words
            ${isUser ? "bg-[#0E1C30] text-slate-100" : "text-slate-200"}
          `}
        >
          {/* Attachments if any */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b border-[#0F1C30]">
              {message.attachments.map((att) => (
                <AttachmentPreview key={att.id} attachment={att} />
              ))}
            </div>
          )}

          {message.content}
        </div>

        {/* Nubi Actions */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleToggleSpeech}
              aria-label={audioState === "playing" ? "Parar áudio" : "Ouvir resposta"}
              className={`p-1 rounded transition-colors ${
                audioState === "playing" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {audioState === "loading" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : audioState === "playing" ? (
                <Square className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={handleCopy}
              aria-label="Copiar"
              className="p-1 rounded text-slate-500 hover:text-slate-300 transition-colors"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              onClick={() => handleFeedback("up")}
              aria-label="Feedback positivo"
              className={`p-1 rounded transition-colors ${
                feedback === "up" ? "text-blue-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => handleFeedback("down")}
              aria-label="Feedback negativo"
              className={`p-1 rounded transition-colors ${
                feedback === "down" ? "text-red-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-6 h-6 rounded-full bg-[#0E1C30] text-slate-300 font-medium flex items-center justify-center shrink-0 text-[11px] mt-0.5">
          Y
        </div>
      )}
    </div>
  );
};
