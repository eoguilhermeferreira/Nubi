import React, { useState, useRef, useEffect } from "react";
import { Attachment } from "../types/chat";
import { Send, Paperclip, Mic, MicOff, X, FileText } from "lucide-react";
import { toast } from "sonner";

interface ChatInputProps {
  onSendMessage: (text: string, attachments?: Attachment[]) => void;
  isLoading?: boolean;
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isLoading = false,
}) => {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        160
      )}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!text.trim() && attachments.length === 0) || isLoading) return;

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

  const handleAttachFile = () => {
    const sampleFiles: Attachment[] = [
      { id: Date.now().toString(), name: "documento.pdf", size: "1.2 MB", type: "file" },
      { id: Date.now().toString() + "2", name: "imagem.png", size: "850 KB", type: "image" },
    ];
    const newAtt = sampleFiles[attachments.length % 2]!;
    setAttachments((prev) => [...prev, newAtt]);
    toast.success(`Anexado: ${newAtt.name}`);
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      setText((prev) => prev + " [Áudio gravado]");
      toast.success("Áudio gravado");
    } else {
      setIsRecording(true);
      toast.info("Escutando... Fale agora");
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
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-1.5 bg-[#050B14] px-2 py-1 rounded text-xs text-slate-300 border border-[#0E1C30]"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate max-w-[120px]">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="text-slate-500 hover:text-slate-200 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          placeholder="Mensagem para Nubi..."
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
            <button
              type="button"
              onClick={handleAttachFile}
              disabled={isLoading}
              aria-label="Anexar arquivo"
              className="p-1.5 rounded text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={toggleRecording}
              disabled={isLoading}
              aria-label="Usar microfone"
              className={`p-1.5 rounded transition-colors focus:outline-none ${
                isRecording ? "text-red-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={(!text.trim() && attachments.length === 0) || isLoading}
            aria-label="Enviar mensagem"
            className={`
              p-1.5 rounded-lg flex items-center justify-center transition-colors
              ${
                (text.trim() || attachments.length > 0) && !isLoading
                  ? "bg-blue-600 text-white hover:bg-blue-500"
                  : "bg-[#050B14] text-slate-600 cursor-not-allowed"
              }
            `}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
