import React, { useState, useRef, useEffect } from "react";
import { Attachment } from "../types/chat";
import {
  Send,
  Paperclip,
  Mic,
  Square,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  AudioLines,
} from "lucide-react";
import { toast } from "sonner";
import {
  isAttachmentTypeAccepted,
  MAX_ATTACHMENT_BYTES,
  uploadAttachment,
  removeAttachment as removeStoredAttachment,
  formatAttachmentSize,
} from "../lib/attachments";
import { blobToBase64, transcribeRecording } from "../lib/voice-input";

interface ChatInputProps {
  onSendMessage: (text: string, attachments?: Attachment[]) => void;
  onOpenVoiceMode: () => void;
  isLoading?: boolean;
  userId: string | null;
  conversationId: string | null;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onOpenVoiceMode,
  isLoading = false,
  userId,
  conversationId,
}) => {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [text]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const busy = isLoading || uploadingCount > 0 || isTranscribing;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && attachments.length === 0) || busy) return;

    onSendMessage(text, attachments.length > 0 ? attachments : undefined);
    setText("");
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || !userId) return;
    const files = Array.from(fileList);
    if (fileInputRef.current) fileInputRef.current.value = "";

    for (const file of files) {
      if (!isAttachmentTypeAccepted(file.type)) {
        toast.error(`${file.name}: tipo de arquivo não suportado (use imagem ou PDF)`);
        continue;
      }
      if (file.size > MAX_ATTACHMENT_BYTES) {
        toast.error(`${file.name}: arquivo maior que 15 MB`);
        continue;
      }

      setUploadingCount((n) => n + 1);
      try {
        const attachment = await uploadAttachment(userId, conversationId ?? "rascunho", file);
        setAttachments((prev) => [...prev, attachment]);
      } catch (err) {
        console.error("[nubi] erro ao anexar arquivo:", err);
        toast.error(`Não foi possível anexar ${file.name}`);
      } finally {
        setUploadingCount((n) => n - 1);
      }
    }
  };

  const handleRemoveAttachment = (attachment: Attachment) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    void removeStoredAttachment(attachment);
  };

  const startRecording = async () => {
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
        setIsTranscribing(true);
        try {
          const audioBase64 = await blobToBase64(blob);
          const transcript = await transcribeRecording(audioBase64, blob.type);
          if (transcript) {
            setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        } catch (err) {
          console.error("[nubi] erro ao transcrever áudio:", err);
          toast.error("Não foi possível transcrever o áudio");
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("[nubi] erro ao acessar microfone:", err);
      toast.error("Não foi possível acessar o microfone");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pt-1 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      <form
        onSubmit={handleSubmit}
        className={`
          relative flex flex-col bg-[#091322] border rounded-xl p-3
          transition-colors duration-150
          ${
            isLoading
              ? "opacity-60 border-[#0E1C30]"
              : "border-[#0E1C30] focus-within:border-[#162D4A]"
          }
        `}
      >
        {/* Attachments chips */}
        {(attachments.length > 0 || uploadingCount > 0) && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 bg-[#050B14] px-2 py-1 rounded text-xs text-slate-300 border border-[#0E1C30]"
              >
                {att.kind === "image" ? (
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="truncate max-w-[120px]">{att.name}</span>
                <span className="text-slate-500">{formatAttachmentSize(att.size)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att)}
                  className="text-slate-500 hover:text-slate-200 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            {uploadingCount > 0 && (
              <div className="flex items-center gap-1.5 bg-[#050B14] px-2 py-1 rounded text-xs text-slate-500 border border-[#0E1C30]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Enviando...
              </div>
            )}
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder={isTranscribing ? "Transcrevendo áudio..." : "Mensagem para Nubi.ia..."}
          rows={1}
          className="
            w-full bg-transparent text-slate-100 placeholder:text-slate-500
            text-xs sm:text-sm resize-none focus:outline-none py-1
            max-h-40 leading-relaxed font-sans
          "
        />

        {/* Composer Controls */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#050B14]">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              multiple
              hidden
              onChange={(e) => void handleFilesSelected(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || !userId}
              aria-label="Anexar arquivo"
              className="p-1.5 rounded text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleRecording}
              disabled={isLoading || isTranscribing}
              aria-label={isRecording ? "Parar gravação" : "Gravar áudio"}
              className={`p-1.5 rounded transition-colors focus:outline-none ${
                isRecording ? "text-red-400 animate-pulse" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isRecording ? (
                <Square className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {text.trim() || attachments.length > 0 ? (
              <button
                type="submit"
                disabled={busy}
                aria-label="Enviar mensagem"
                className={`
                  p-1.5 rounded-lg flex items-center justify-center transition-colors
                  ${busy ? "bg-[#050B14] text-slate-600 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-500"}
                `}
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenVoiceMode}
                disabled={isLoading}
                aria-label="Conversar por voz"
                className="p-1.5 rounded-lg flex items-center justify-center bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                <AudioLines className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
