import { useState, useEffect } from "react";
import type { SubProject } from "../types/project";

interface DeleteSubProjectModalProps {
  subProject: SubProject | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (subProjectId: string) => void;
}

export function DeleteSubProjectModal({
  subProject,
  isOpen,
  onClose,
  onConfirmDelete,
}: DeleteSubProjectModalProps) {
  const [confirmationInput, setConfirmationInput] = useState("");

  useEffect(() => {
    setConfirmationInput("");
  }, [subProject, isOpen]);

  if (!isOpen || !subProject) return null;

  const targetTextName = subProject.name.trim().toLowerCase();
  const inputNormalized = confirmationInput.trim().toLowerCase();

  // O botão só é habilitado se digitar "EXCLUIR" ou o nome exato da rota/sub-projeto
  const isConfirmationValid =
    inputNormalized === "excluir" || inputNormalized === targetTextName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmationValid) return;
    onConfirmDelete(subProject.id);
    onClose();
  };

  const isLowLevel = subProject.mode === "low-level";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn selection:bg-rose-500 selection:text-white">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header de Perigo */}
        <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center text-lg font-bold shadow-2xs">
              <i className="fa-solid fa-triangle-exclamation text-rose-600"></i>
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Excluir Rota / Módulo Permanentemente
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                Esta ação destruirá os diagramas e dados desta rota e não poderá ser desfeita
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Corpo do Modal */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Identificação da Rota / Sub-projeto */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Rota / Módulo Selecionado:
            </div>
            <div className="text-sm font-extrabold text-slate-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <i className={`fa-solid ${isLowLevel ? "fa-code text-blue-600" : "fa-sitemap text-violet-600"}`}></i>
                <span className="truncate">{subProject.name}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border shrink-0 ${
                  isLowLevel
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-violet-50 text-violet-700 border-violet-200"
                }`}
              >
                {isLowLevel ? "Baixo Nível" : "Alto Nível"}
              </span>
            </div>
          </div>

          {/* Alerta de Perda de Dados da Rota */}
          <div className="p-4 bg-rose-50/80 border border-rose-200/80 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-rose-900">
              <i className="fa-solid fa-trash-can text-rose-600"></i>
              <span>Confirmação de Exclusão</span>
            </div>
            <p className="text-xs text-rose-800 leading-relaxed">
              Ao excluir a rota <strong>"{subProject.name}"</strong>, todos os diagramas Mermaid, diagramas de sequência, especificações e prompts associados a ela serão apagados.
            </p>
          </div>

          {/* Campo de Confirmação Escrita */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Para confirmar, digite a palavra <span className="text-rose-600 font-black">EXCLUIR</span> ou o nome da rota:
            </label>

            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={`Digite EXCLUIR ou "${subProject.name}"...`}
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600 transition-all font-mono"
            />
          </div>

          {/* Ações */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!isConfirmationValid}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-600"
            >
              <i className="fa-solid fa-trash-can"></i>
              <span>Excluir Rota Permanentemente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
