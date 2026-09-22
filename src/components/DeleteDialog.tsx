import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  heading?: string;
}

export const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "esta conversa",
  heading = "Excluir conversa?",
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="sm:max-w-md bg-[#0D1C33] border-[#182F52] text-slate-100">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-white">
            {heading}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400 text-sm">
            Tem certeza de que deseja excluir{" "}
            <span className="font-medium text-slate-200">"{title}"</span>? Esta ação não pode ser
            desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="gap-2 sm:gap-0 pt-2">
          <AlertDialogCancel
            onClick={onClose}
            className="bg-transparent border-[#182F52] text-slate-300 hover:bg-[#12243E] hover:text-white"
          >
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-500 text-white font-medium shadow-sm shadow-red-950/40"
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
