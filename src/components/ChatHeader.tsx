import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Menu,
  MoreVertical,
  Share2,
  Trash2,
  Settings,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface ChatHeaderProps {
  modelName?: string;
  onOpenMobileSidebar: () => void;
  onClearChat?: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  hasMessages?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  modelName = "Nubi 3.5",
  onOpenMobileSidebar,
  onClearChat,
  onOpenSettings,
  onOpenAbout,
  hasMessages = false,
}) => {
  const handleExport = () => {
    toast.success("Link da conversa copiado!");
  };

  return (
    <header className="h-12 min-h-[48px] px-4 bg-[#050B14] border-b border-[#0D1829] flex items-center justify-between z-30 select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          aria-label="Abrir histórico"
          className="lg:hidden p-1 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-100 tracking-tight">
            Nubi.ia
          </span>
          <span className="text-xs text-slate-500 font-normal">
            • {modelName}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Opções do chat"
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-[#0A1424] transition-colors focus:outline-none"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-44 bg-[#0A1424] border-[#0F1C30] text-slate-200 p-1 shadow-lg rounded-lg"
          >
            {hasMessages && (
              <>
                <DropdownMenuItem
                  onClick={handleExport}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#0F1E36] rounded cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Compartilhar</span>
                </DropdownMenuItem>

                {onClearChat && (
                  <DropdownMenuItem
                    onClick={onClearChat}
                    className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar chat</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-[#0F1C30] my-1" />
              </>
            )}

            <DropdownMenuItem
              onClick={onOpenSettings}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#0F1E36] rounded cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span>Configurações</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onOpenAbout}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#0F1E36] rounded cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>Sobre a Nubi</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
