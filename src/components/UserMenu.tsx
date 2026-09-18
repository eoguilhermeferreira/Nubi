import React from "react";
import { UserProfile } from "../types/chat";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Settings, LogOut, MoreHorizontal } from "lucide-react";

interface UserMenuProps {
  user: UserProfile;
  onOpenSettings: () => void;
  onSignOut: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onOpenSettings, onSignOut }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#0A1424] text-left transition-colors group focus:outline-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#12223C] text-slate-200 text-xs flex items-center justify-center font-medium shrink-0">
              {user.avatarText}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-slate-200 truncate">{user.name}</div>
              <div className="text-[11px] text-slate-500 truncate">{user.plan}</div>
            </div>
          </div>

          <MoreHorizontal className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="top"
        className="w-48 mb-1 bg-[#0A1424] border-[#0F1C30] text-slate-200 p-1 shadow-lg rounded-lg"
      >
        <div className="px-2.5 py-1.5 border-b border-[#0F1C30] mb-1">
          <p className="text-xs font-medium text-slate-200">{user.name}</p>
          <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
        </div>

        <DropdownMenuItem
          onClick={onOpenSettings}
          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#0F1E36] rounded cursor-pointer"
        >
          <Settings className="w-3.5 h-3.5 text-slate-400" />
          <span>Configurações</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={onSignOut}
          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-[#0F1E36] rounded cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400" />
          <span>Sair</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[#0F1C30] my-1" />

        <div className="px-2.5 py-1 text-[11px] text-slate-500">Nubi.ia v1.0</div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
