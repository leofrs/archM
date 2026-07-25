import { useState, useEffect } from "react";
import type { Workspace } from "../types/project";

interface DeleteWorkspaceModalProps {
  workspace: Workspace | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (workspaceId: string) => void;
}

export function DeleteWorkspaceModal({
  workspace,
  isOpen,
  onClose,
  onConfirmDelete,
}: DeleteWorkspaceModalProps) {
  const [confirmationInput, setConfirmationInput] = useState("");

  useEffect(() => {
    setConfirmationInput("");
  }, [workspace, isOpen]);

  if (!isOpen || !workspace) return null;

  const subProjectsCount = workspace.subProjects?.length || 0;
  const targetTextName = workspace.name.trim().toLowerCase();
  const inputNormalized = confirmationInput.trim().toLowerCase();

  // O botão só é habilitado se digitar "EXCLUIR" ou o nome exato do Workspace
  const isConfirmationValid =
    inputNormalized === "excluir" || inputNormalized === targetTextName;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmationValid) return;
    onConfirmDelete(workspace.id);
    onClose();
  };

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
                Excluir Workspace Permanentemente
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                Esta ação apagará todos os dados e não poderá ser desfeita
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

        {/* Corpo do Modal com Detalhamento de Sub-projetos */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Identificação do Workspace */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Workspace Selecionado:
            </div>
            <div className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <i className={`fa-solid ${workspace.icon || "fa-folder-closed"} text-indigo-600`}></i>
              <span>{workspace.name}</span>
            </div>
            {workspace.description && (
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                {workspace.description}
              </p>
            )}
          </div>

          {/* Alerta da Quantidade de Sub-projetos que serão destruídos */}
          <div className="p-4 bg-rose-50/80 border border-rose-200/80 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between text-xs font-extrabold text-rose-900">
              <span className="flex items-center gap-2">
                <i className="fa-solid fa-layer-group text-rose-600"></i>
                <span>Atenção: Perda de Dados em Massa</span>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-rose-200/80 border border-rose-300 text-rose-950 font-bold text-[11px]">
                {subProjectsCount} {subProjectsCount === 1 ? "Sub-projeto" : "Sub-projetos / Rotas"}
              </span>
            </div>

            <p className="text-xs text-rose-800 leading-relaxed">
              Este workspace contém <strong>{subProjectsCount}</strong> {subProjectsCount === 1 ? "sub-projeto/rota cadastrado" : "sub-projetos e rotas cadastrados"}. Ao prosseguir, todos os diagramas Mermaid, diagramas de sequência, prompts e metadados serão excluídos permanentemente.
            </p>

            {/* Listagem Visual de Sub-projetos */}
            {workspace.subProjects && workspace.subProjects.length > 0 && (
              <div className="pt-2 border-t border-rose-200/60">
                <div className="text-[10px] font-bold uppercase tracking-wider text-rose-900 mb-1.5">
                  Sub-projetos / Rotas que serão apagados:
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                  {workspace.subProjects.map((sub) => (
                    <span
                      key={sub.id}
                      className="px-2 py-1 bg-white border border-rose-200 text-rose-900 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 shadow-2xs"
                    >
                      <i className={`fa-solid ${sub.mode === "low-level" ? "fa-code text-blue-600" : "fa-sitemap text-violet-600"} text-[10px]`}></i>
                      <span>{sub.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Campo de Confirmação Escrita */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800">
              Para confirmar, digite a palavra <span className="text-rose-600 font-black">EXCLUIR</span> ou o nome do workspace:
            </label>

            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              placeholder={`Digite EXCLUIR ou "${workspace.name}"...`}
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
              <span>Excluir Workspace Permanentemente</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
