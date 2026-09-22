import React, { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { JournalEntry } from "../types/journal";
import { formatEntryDate } from "../lib/journal-api";

interface JournalViewProps {
  activeEntry: JournalEntry | null;
  onSave: (content: string) => void;
  onOpenMobileSidebar: () => void;
}

type SaveStatus = "idle" | "saving" | "saved";

const SAVE_DEBOUNCE_MS = 700;

export const JournalView: React.FC<JournalViewProps> = ({
  activeEntry,
  onSave,
  onOpenMobileSidebar,
}) => {
  const [text, setText] = useState(activeEntry?.content ?? "");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Inicializa uma vez a partir da prop; o componente é remontado (via `key`)
  // sempre que o usuário troca de entrada de verdade, então não precisa de
  // um efeito pra resetar — isso evitaria sobrescrever o que a pessoa está
  // digitando bem no momento em que um rascunho vira uma entrada salva.
  const lastSavedRef = useRef(activeEntry?.content ?? "");

  useEffect(() => {
    if (text === lastSavedRef.current) return;
    setStatus("saving");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      lastSavedRef.current = text;
      onSave(text);
      setStatus("saved");
    }, SAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const statusLabel = status === "saving" ? "Salvando..." : status === "saved" ? "Salvo" : "";

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <header className="h-12 min-h-[48px] px-4 bg-[#050B14] border-b border-[#0D1829] flex items-center gap-3 z-30 select-none">
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Abrir histórico"
          className="lg:hidden p-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-slate-100 tracking-tight">Diário</span>
        {activeEntry && (
          <span className="text-xs text-slate-500 font-normal">
            • {formatEntryDate(activeEntry.updatedAt)}
          </span>
        )}
        <span className="ml-auto text-[11px] text-slate-600">{statusLabel}</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <div className="max-w-2xl mx-auto h-full">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escreva o que você quiser aqui. Ninguém além de você lê isso."
            className="
              w-full h-full min-h-[60vh] bg-transparent text-slate-100 placeholder:text-slate-500
              text-sm resize-none focus:outline-none leading-relaxed font-sans
            "
            autoFocus
          />
        </div>
      </div>
    </div>
  );
};
