import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [autoScroll, setAutoScroll] = useState(true);

  const handleSave = () => {
    toast.success("Configurações salvas!");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0A1424] border-[#0F1C30] text-slate-100 p-5 rounded-xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-white">
            Configurações da Nubi.ia
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#050B14] border border-[#0F1C30]">
            <div>
              <div className="font-medium text-slate-200">Rolagem automática</div>
              <div className="text-[11px] text-slate-500">
                Rolar automaticamente para novas mensagens
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#050B14] border border-[#0F1C30] text-slate-400 text-[11px]">
            As conversas são armazenadas localmente no seu navegador.
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#0F1C30]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="bg-transparent border-[#0F1C30] text-slate-300 hover:bg-[#050B14]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
