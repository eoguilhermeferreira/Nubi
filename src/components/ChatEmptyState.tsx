import React from "react";
import { PROMPT_SUGGESTIONS } from "../mock/initialData";
import { SuggestionCard } from "./SuggestionCard";

interface ChatEmptyStateProps {
  onSelectPrompt: (promptText: string) => void;
}

export const ChatEmptyState: React.FC<ChatEmptyStateProps> = ({ onSelectPrompt }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-2xl mx-auto w-full text-center overflow-y-auto">
      {/* Brand Header */}
      <div className="text-sm font-semibold text-slate-400 mb-2">Nubi.ia</div>

      {/* Main Title */}
      <h1 className="text-xl sm:text-2xl font-semibold text-slate-100 tracking-tight mb-2">
        Como posso ajudar?
      </h1>

      <p className="text-xs text-slate-500 mb-8 max-w-md">
        Inicie uma conversa, explore uma ideia ou peça ajuda com um problema.
      </p>

      {/* Discrete Suggestions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
        {PROMPT_SUGGESTIONS.map((suggestion) => (
          <SuggestionCard key={suggestion.id} suggestion={suggestion} onClick={onSelectPrompt} />
        ))}
      </div>
    </div>
  );
};
