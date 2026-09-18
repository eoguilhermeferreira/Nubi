import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#0A1424] border-[#0F1C30] text-slate-100 p-5 rounded-xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold text-white">Sobre a Nubi.ia</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs text-slate-300 leading-relaxed">
          <p>
            A <strong className="text-white">Nubi.ia</strong> é uma ferramenta de inteligência
            artificial criada para ser simples, silenciosa e focada inteiramente na conversa.
          </p>
          <p className="text-slate-400 text-[11px]">Versão 1.0 • Interface minimalista</p>
        </div>

        <div className="flex justify-end pt-2 border-t border-[#0F1C30]">
          <Button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-4"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
