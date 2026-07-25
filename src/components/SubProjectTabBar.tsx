import { useState } from "react";
import type { Workspace, SubProject } from "../types/project";

interface SubProjectTabBarProps {
  workspace: Workspace;
  activeSubProjectId: string;
  onSelectSubProject: (subProjectId: string) => void;
  onAddSubProject: (name: string, mode: "low-level" | "high-level") => void;
  onRenameSubProject: (subProjectId: string, newName: string) => void;
  onDuplicateSubProject: (subProjectId: string) => void;
  onDeleteSubProject: (subProjectId: string) => void;
  onBackToDashboard: () => void;
}

export function SubProjectTabBar({
  workspace,
  activeSubProjectId,
  onSelectSubProject,
  onAddSubProject,
  onRenameSubProject,
  onDuplicateSubProject,
  onDeleteSubProject,
  onBackToDashboard,
}: SubProjectTabBarProps) {
  // Modal de Criação de Novo Sub-projeto
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubMode, setNewSubMode] = useState<"low-level" | "high-level">("low-level");

  // Estado para Edição (Renomeação) Inline
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleOpenAddModal = () => {
    setNewSubName("");
    setNewSubMode("low-level");
    setIsAddModalOpen(true);
  };

  const handleCreateSubProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    onAddSubProject(newSubName.trim(), newSubMode);
    setIsAddModalOpen(false);
  };

  const handleStartRename = (sub: SubProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSubId(sub.id);
    setEditingName(sub.name);
  };

  const handleSaveRename = (subId: string) => {
    if (editingName.trim()) {
      onRenameSubProject(subId, editingName.trim());
    }
    setEditingSubId(null);
  };

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-slate-100 shadow-inner">
      {/* Lado Esquerdo: Identificação do Workspace & Voltar */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
          title="Voltar ao Dashboard de Workspaces"
        >
          <i className="fa-solid fa-arrow-left text-[11px]"></i>
          <span>Dashboard</span>
        </button>

        <div className="h-4 w-px bg-slate-700"></div>

        <div className="flex items-center gap-2 max-w-[200px] sm:max-w-[300px]">
          <i className={`fa-solid ${workspace.icon || "fa-folder-closed"} text-indigo-400 text-sm shrink-0`}></i>
          <span className="font-bold text-xs truncate text-slate-100" title={workspace.name}>
            {workspace.name}
          </span>
          {workspace.isExample && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30 shrink-0">
              Exemplo
            </span>
          )}
        </div>
      </div>

      {/* Centro/Direita: Abas dos Sub-projetos / Rotas */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden lg:inline mr-1">
          Rotas / Sub-projetos:
        </span>

        {workspace.subProjects.map((sub) => {
          const isActive = sub.id === activeSubProjectId;
          const isEditing = editingSubId === sub.id;

          return (
            <div
              key={sub.id}
              onClick={() => !isEditing && onSelectSubProject(sub.id)}
              className={`group relative px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0 select-none ${
                isActive
                  ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700/90 hover:text-white"
              }`}
            >
              {/* Ícone de Modo */}
              <i
                className={`fa-solid ${sub.mode === "low-level" ? "fa-code text-indigo-300" : "fa-sitemap text-emerald-300"} text-[11px]`}
                title={sub.mode === "low-level" ? "Baixo Nível (Endpoints / DTOs)" : "Alto Nível (Microsserviços)"}
              ></i>

              {/* Nome do Sub-projeto (ou Input de Edição) */}
              {isEditing ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => handleSaveRename(sub.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveRename(sub.id);
                    if (e.key === "Escape") setEditingSubId(null);
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  className="bg-slate-900 text-white text-xs px-1.5 py-0.5 rounded border border-indigo-400 focus:outline-none w-28"
                />
              ) : (
                <span className="truncate max-w-[130px] sm:max-w-[160px]">{sub.name}</span>
              )}

              {/* Ações Rápidas de Sub-projeto (Renomear, Duplicar, Excluir) */}
              {!isEditing && (
                <div className={`items-center gap-1 transition-opacity ${isActive ? "flex opacity-100" : "hidden group-hover:flex opacity-80 hover:opacity-100"}`}>
                  <button
                    type="button"
                    onClick={(e) => handleStartRename(sub, e)}
                    className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10"
                    title="Renomear rota/sub-projeto"
                  >
                    <i className="fa-solid fa-pen text-[10px]"></i>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateSubProject(sub.id);
                    }}
                    className="p-1 text-slate-300 hover:text-white rounded hover:bg-white/10"
                    title="Duplicar esta rota"
                  >
                    <i className="fa-solid fa-copy text-[10px]"></i>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSubProject(sub.id);
                    }}
                    className="p-1 text-rose-300 hover:text-rose-100 rounded hover:bg-rose-500/20 cursor-pointer"
                    title="Excluir sub-projeto"
                  >
                    <i className="fa-solid fa-xmark text-[10px]"></i>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Botão para Adicionar Nova Rota / Sub-projeto */}
        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-3 py-1.5 rounded-xl border border-dashed border-indigo-500/50 hover:border-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          title="Adicionar nova rota ou sub-projeto ao Workspace"
        >
          <i className="fa-solid fa-plus text-[11px]"></i>
          <span>Nova Rota</span>
        </button>
      </div>

      {/* MODAL DE CRIAÇÃO RÁPIDA DE SUB-PROJETO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs grid place-items-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <i className="fa-solid fa-plus-circle text-indigo-400"></i>
                Adicionar Nova Rota / Sub-projeto
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome da Rota ou Módulo:
                </label>
                <input
                  type="text"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  placeholder="Ex: POST /v1/payments/pix ou Módulo de Notificação"
                  autoFocus
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Modo do Diagrama:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewSubMode("low-level")}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      newSubMode === "low-level"
                        ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <i className="fa-solid fa-code"></i>
                    <span>Baixo Nível</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewSubMode("high-level")}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      newSubMode === "high-level"
                        ? "bg-emerald-600/30 border-emerald-500 text-emerald-200"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <i className="fa-solid fa-sitemap"></i>
                    <span>Alto Nível</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  Criar Rota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
