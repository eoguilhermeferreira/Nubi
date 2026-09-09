import React, { useState } from "react";
import { Conversation, UserProfile } from "../types/chat";
import { ConversationMenu } from "./ConversationMenu";
import { UserMenu } from "./UserMenu";
import { RenameModal } from "./RenameModal";
import { DeleteDialog } from "./DeleteDialog";
import { Plus, X } from "lucide-react";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  onSignOut: () => void;
  isLoading?: boolean;
  busyId?: string | null;
  user: UserProfile;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onDeleteConversation,
  onOpenSettings,
  onSignOut,
  isLoading = false,
  busyId = null,
  user,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const [renamingConv, setRenamingConv] = useState<Conversation | null>(null);
  const [deletingConv, setDeletingConv] = useState<Conversation | null>(null);

  const handleRenameConfirm = (newTitle: string) => {
    if (renamingConv) {
      onRenameConversation(renamingConv.id, newTitle);
      setRenamingConv(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (deletingConv) {
      onDeleteConversation(deletingConv.id);
      setDeletingConv(null);
    }
  };

  return (
    <>
      <aside
        className={`
          flex flex-col h-full w-[260px] bg-[#060D18] border-r border-[#0D1829] select-none
          shrink-0 z-40 transition-all duration-200 ease-in-out
          ${
            isMobileOpen
              ? "fixed inset-y-0 left-0 translate-x-0 shadow-2xl"
              : "hidden lg:flex"
          }
        `}
      >
        {/* Top Header / App Name */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-slate-100 tracking-tight">
              Nubi.ia
            </span>
          </div>

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              aria-label="Fechar menu"
              className="lg:hidden p-1 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Action: + Nova conversa */}
        <div className="px-3 pb-3">
          <button
            onClick={() => {
              onNewConversation();
              if (onCloseMobile) onCloseMobile();
            }}
            className="
              w-full h-9 flex items-center justify-center gap-2
              bg-[#0A1424] hover:bg-[#0F1E36] active:bg-[#0D192C]
              border border-[#0F1C30] hover:border-[#162D4A]
              text-slate-200 hover:text-white text-xs font-medium rounded-lg
              transition-colors duration-150 focus:outline-none
            "
          >
            <Plus className="w-3.5 h-3.5 text-slate-400" />
            <span>Nova conversa</span>
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          <div className="px-2 py-1.5 text-[11px] font-medium text-slate-500">
            Conversas
          </div>

          {isLoading ? (
            <div className="py-6 text-center px-4">
              <p className="text-xs text-slate-600">Carregando conversas...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="py-6 text-center px-4">
              <p className="text-xs text-slate-500">Nenhuma conversa</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeId;
              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`
                    group relative flex items-center justify-between px-2.5 py-2 rounded-lg cursor-pointer text-xs
                    transition-colors duration-150
                    ${busyId === conv.id ? "opacity-50 pointer-events-none" : ""}
                    ${
                      isActive
                        ? "bg-[#0F1E36] text-white font-medium"
                        : "text-slate-400 hover:bg-[#0A1424] hover:text-slate-200"
                    }
                  `}
                >
                  <span className="truncate text-xs leading-relaxed max-w-[180px]">
                    {conv.title}
                  </span>

                  <ConversationMenu
                    onRename={() => setRenamingConv(conv)}
                    onDelete={() => setDeletingConv(conv)}
                  />
                </div>
              );
            })
          )}
        </div>

        {/* User Footer */}
        <div className="p-2 border-t border-[#0D1829]">
          <UserMenu
            user={user}
            onOpenSettings={onOpenSettings}
            onSignOut={onSignOut}
          />
        </div>
      </aside>

      {/* Modals for renaming & deleting */}
      {renamingConv && (
        <RenameModal
          isOpen={!!renamingConv}
          onClose={() => setRenamingConv(null)}
          currentTitle={renamingConv.title}
          onRename={handleRenameConfirm}
        />
      )}

      {deletingConv && (
        <DeleteDialog
          isOpen={!!deletingConv}
          onClose={() => setDeletingConv(null)}
          title={deletingConv.title}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </>
  );
};
