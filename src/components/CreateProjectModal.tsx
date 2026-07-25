import { useState, useEffect } from "react";
import type { Project } from "../types/project";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    description: string;
    mode: "low-level" | "high-level";
    templateId?: string;
  }) => void;
  projectToEdit?: Project | null;
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onSubmit,
  projectToEdit,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"low-level" | "high-level">("low-level");

  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setDescription(projectToEdit.description);
      setMode(projectToEdit.mode);
    } else {
      setName("");
      setDescription("");
      setMode("low-level");
    }
  }, [projectToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSubmit({
      name: name.trim(),
      description: description.trim(),
      mode,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shadow-xs">
              <i className={projectToEdit ? "fa-solid fa-pen-to-square" : "fa-solid fa-diagram-project"}></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {projectToEdit ? "Editar Projeto" : "Criar Novo Projeto de Arquitetura"}
              </h3>
              <p className="text-xs text-slate-500">
                {projectToEdit
                  ? "Atualize as informações do seu projeto"
                  : "Defina o nome e o nível de abstração"}
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

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Nome */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nome do Projeto <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: API Gateway de Pagamentos, Microserviço de Auth..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400 bg-slate-50/30"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Descrição do Projeto
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve resumo da finalidade da arquitetura, integrações ou contexto do sistema..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400 bg-slate-50/30 resize-none"
            />
          </div>

          {/* Seletor de Modo (Baixo Nível vs Alto Nível) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nível da Arquitetura (Modo de Visualização)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("low-level")}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  mode === "low-level"
                    ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 text-indigo-900"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <i className="fa-solid fa-code text-indigo-600"></i>
                    Baixo Nível
                  </span>
                  {mode === "low-level" && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Endpoints REST, DTOs de entrada/saída, Headers e Edge Cases técnicos.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMode("high-level")}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  mode === "high-level"
                    ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 text-indigo-900"
                    : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs flex items-center gap-1.5">
                    <i className="fa-solid fa-sitemap text-indigo-600"></i>
                    Alto Nível
                  </span>
                  {mode === "high-level" && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Topologia de sistemas, comunicação entre microsserviços e mensageria.
                </p>
              </button>
            </div>
          </div>



          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <i className={projectToEdit ? "fa-solid fa-check" : "fa-solid fa-plus"}></i>
              <span>{projectToEdit ? "Salvar Alterações" : "Criar Projeto"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
