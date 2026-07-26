import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Workspace, SubProject } from "../types/project";
import type { LLMConfig } from "../types/llm";
import { getActiveLLMKey, getActiveLLMModel, LLM_PROVIDERS } from "../utils/llmStorage";

interface SidebarProps {
  workspace: Workspace | null;
  activeSubProjectId: string;
  onSelectSubProject: (subProjectId: string) => void;
  onAddSubProject: (name: string, mode: "low-level" | "high-level") => void;
  onRenameSubProject: (subProjectId: string, newName: string) => void;
  onDuplicateSubProject: (subProjectId: string) => void;
  onDeleteSubProject: (subProjectId: string) => void;
  onDeleteWorkspace?: (workspace: Workspace) => void;
  onBackToDashboard: () => void;
  llmConfig: LLMConfig;
  onOpenLLMConfig: () => void;
  promptInput: string;
  setPromptInput: (input: string) => void;
  mode: "low-level" | "high-level";
  setMode: (mode: "low-level" | "high-level") => void;
  includeEdgeCases: boolean;
  setIncludeEdgeCases: (include: boolean) => void;
  isLoading: boolean;
  onGenerate: () => void;
  statusMsg: string;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

interface PostmanRequestItem {
  name: string;
  method: string;
  url: string;
  body: string;
}

export function Sidebar({
  workspace,
  activeSubProjectId,
  onSelectSubProject,
  onAddSubProject,
  onRenameSubProject,
  onDuplicateSubProject,
  onDeleteSubProject,
  onDeleteWorkspace,
  onBackToDashboard,
  llmConfig,
  onOpenLLMConfig,
  promptInput,
  setPromptInput,
  mode: _mode,
  setMode: _setMode,
  includeEdgeCases,
  setIncludeEdgeCases,
  isLoading,
  onGenerate,
  statusMsg,
  isSidebarOpen,
  setIsSidebarOpen,
}: SidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileBadge, setFileBadge] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Estado para controlar a expansão INDEPENDENTE de cada sub-rota (Set de IDs)
  const [expandedSubIds, setExpandedSubIds] = useState<Set<string>>(
    () => new Set(activeSubProjectId ? [activeSubProjectId] : [])
  );

  // Garante que a rota ativa iniciada/alterada esteja expandida
  useEffect(() => {
    if (activeSubProjectId) {
      setExpandedSubIds((prev) => {
        if (prev.has(activeSubProjectId)) return prev;
        const next = new Set(prev);
        next.add(activeSubProjectId);
        return next;
      });
    }
  }, [activeSubProjectId]);

  // Alternar a expansão/retração de uma rota de forma INDEPENDENTE
  const toggleExpandSubProject = (subId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedSubIds((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) {
        next.delete(subId);
      } else {
        next.add(subId);
      }
      return next;
    });
  };

  // Clicar na rota ativa a rota para visualização e garante que está expandida
  const handleSelectRouteHeader = (subId: string) => {
    onSelectSubProject(subId);
    setExpandedSubIds((prev) => {
      if (prev.has(subId)) return prev;
      const next = new Set(prev);
      next.add(subId);
      return next;
    });
  };

  // Estado para Edição (Renomeação) Inline de Rota na Sidebar
  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Modal rápido de adição de rota na Sidebar
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [newSubMode, setNewSubMode] = useState<"low-level" | "high-level">("low-level");

  if (!isSidebarOpen) return null;

  // --- PARSERS DE ARQUIVO: OpenAPI, Postman, Insomnia ---
  const formatOpenAPISpec = (spec: any) => {
    let output = `[ESPECIFICAÇÃO OPENAPI / SWAGGER IMPORTADA]\n`;
    output += `Título: ${spec.info?.title || "API Especificação"}\n`;
    if (spec.info?.description) {
      output += `Descrição: ${spec.info.description}\n`;
    }
    output += `\nENDPOINTS E FLUXOS DETECTADOS:\n`;

    if (spec.paths) {
      Object.entries(spec.paths).forEach(([path, methods]: [string, any]) => {
        Object.entries(methods).forEach(([method, details]: [string, any]) => {
          if (
            ["get", "post", "put", "delete", "patch"].includes(
              method.toLowerCase()
            )
          ) {
            output += `\n- Rota: ${method.toUpperCase()} ${path}\n`;
            if (details.summary) output += `  Resumo: ${details.summary}\n`;
            if (details.responses) {
              const statusCodes = Object.keys(details.responses).join(", ");
              output += `  Status HTTP de Retorno: ${statusCodes}\n`;
            }
          }
        });
      });
    }

    const count = Object.keys(spec.paths || {}).length;
    return {
      text: output,
      badge: `OpenAPI: "${spec.info?.title || "API"}" (${count} rotas)`,
    };
  };

  const extractPostmanRequests = (items: any[], result: PostmanRequestItem[] = []): PostmanRequestItem[] => {
    if (!Array.isArray(items)) return result;

    for (const item of items) {
      if (item.request) {
        const method = item.request.method || "GET";
        let url = "";
        if (typeof item.request.url === "string") {
          url = item.request.url;
        } else if (item.request.url?.raw) {
          url = item.request.url.raw;
        } else if (Array.isArray(item.request.url?.path)) {
          url = "/" + item.request.url.path.join("/");
        }

        let bodySummary = "";
        if (item.request.body?.mode === "raw" && item.request.body?.raw) {
          bodySummary = item.request.body.raw.slice(0, 150);
        }

        result.push({
          name: item.name || "Sem nome",
          method: method.toUpperCase(),
          url,
          body: bodySummary,
        });
      }
      if (item.item) {
        extractPostmanRequests(item.item, result);
      }
    }
    return result;
  };

  const formatPostmanCollection = (data: any) => {
    const requests = extractPostmanRequests(data.item);
    let output = `[COLEÇÃO POSTMAN IMPORTADA]\n`;
    output += `Nome da Coleção: ${data.info?.name || "Postman Collection"}\n`;
    output += `Total de Requisições: ${requests.length}\n\n`;
    output += `REQUISIÇÕES E ROTAS DETECTADAS:\n`;

    requests.forEach((req, idx) => {
      output += `\n${idx + 1}. [${req.method}] ${req.name}\n`;
      if (req.url) output += `   URL/Rota: ${req.url}\n`;
      if (req.body) output += `   Payload Exemplo: ${req.body}\n`;
    });

    const name = data.info?.name || "Postman";
    return {
      text: output,
      badge: `Postman: "${name}" (${requests.length} requisições)`,
    };
  };

  const formatInsomniaCollection = (data: any) => {
    const requests = (data.resources || []).filter(
      (r: any) => r._type === "request"
    );
    let output = `[COLEÇÃO INSOMNIA IMPORTADA]\n`;
    output += `Total de Requisições: ${requests.length}\n\n`;
    output += `REQUISIÇÕES E ROTAS DETECTADAS:\n`;

    requests.forEach((req: any, idx: number) => {
      const method = (req.method || "GET").toUpperCase();
      const name = req.name || "Sem nome";
      const url = req.url || "";
      output += `\n${idx + 1}. [${method}] ${name}\n`;
      if (url) output += `   URL/Rota: ${url}\n`;
      if (req.body?.text) {
        output += `   Payload Exemplo: ${req.body.text.slice(0, 150)}\n`;
      }
    });

    return {
      text: output,
      badge: `Insomnia Export (${requests.length} requisições)`,
    };
  };

  const processFile = (file?: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (!content || typeof content !== "string") return;

      let processedText = content;
      let badgeText = `Arquivo "${file.name}" importado`;

      if (file.name.endsWith(".json")) {
        try {
          const parsed = JSON.parse(content);

          if (parsed.openapi || parsed.swagger || parsed.paths) {
            const res = formatOpenAPISpec(parsed);
            processedText = res.text;
            badgeText = res.badge;
          } else if (
            parsed.info?._postman_id ||
            parsed.info?.schema?.includes("postman") ||
            (parsed.info?.name && Array.isArray(parsed.item))
          ) {
            const res = formatPostmanCollection(parsed);
            processedText = res.text;
            badgeText = res.badge;
          } else if (
            parsed._type === "export" ||
            (Array.isArray(parsed.resources) &&
              parsed.resources.some((r: any) => r._type === "request"))
          ) {
            const res = formatInsomniaCollection(parsed);
            processedText = res.text;
            badgeText = res.badge;
          }
        } catch (e) {
          // Ignora erro de parse
        }
      }

      setPromptInput(processedText);
      setFileBadge(badgeText);
    };

    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    processFile(file);
  };

  const handleClearFile = () => {
    setFileBadge("");
    setPromptInput("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const handleCreateSubProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    onAddSubProject(newSubName.trim(), newSubMode);
    setIsAddModalOpen(false);
    setNewSubName("");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-[88vw] max-w-[400px] lg:relative lg:w-[400px] lg:z-10 shrink-0 bg-white text-slate-900 border-r border-slate-200/80 flex flex-col p-4 sm:p-5 shadow-lg lg:shadow-xs transition-all duration-300 overflow-y-auto selection:bg-indigo-500 selection:text-white">
      {/* 1. TOPO: WORKSPACE & VOLTAR AO DASHBOARD (TEMA CLARO CLASSICO) */}
      <div className="pb-4 border-b border-slate-100 mb-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-slate-200 shrink-0"
            title="Voltar ao Dashboard"
          >
            <i className="fa-solid fa-arrow-left text-xs"></i>
            <span>Voltar ao Dashboard</span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            {workspace && !workspace.isExample && onDeleteWorkspace && (
              <button
                type="button"
                onClick={() => onDeleteWorkspace(workspace)}
                className="w-7 h-7 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 grid place-items-center transition-colors cursor-pointer shrink-0"
                title="Excluir Workspace Permanentemente"
              >
                <i className="fa-solid fa-trash-can text-xs"></i>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 grid place-items-center transition-colors cursor-pointer shrink-0"
              title="Recolher Menu Lateral"
            >
              <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
          </div>
        </div>

        <div className="min-w-0 pt-0.5">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm truncate">
              {workspace?.name || "Workspace"}
            </span>
            {workspace?.isExample && (
              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold border border-amber-200 shrink-0">
                Exemplo
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 truncate">
            {workspace?.subProjects.length || 0} rotas no workspace
          </p>
        </div>
      </div>

      {/* 2. CONFIGURAÇÃO DE PROVEDOR LLM */}
      {(() => {
        const activeKey = getActiveLLMKey(llmConfig);
        const activeProviderInfo = LLM_PROVIDERS[llmConfig.activeProvider];
        const activeModel = getActiveLLMModel(llmConfig);
        const hasKey = !!activeKey.trim();

        return (
          <div className="mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                <i className={`${activeProviderInfo.icon} text-indigo-600`}></i>
                <span>{activeProviderInfo.name}</span>
              </div>
              <button
                type="button"
                onClick={onOpenLLMConfig}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
              >
                Configurar IA
              </button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-mono text-[10px] text-slate-600 truncate max-w-[150px]">
                {activeModel}
              </span>
              <span
                className={`font-semibold text-[10px] px-2 py-0.5 rounded-full ${
                  hasKey
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {hasKey ? "Conectado" : "Sem Chave"}
              </span>
            </div>
          </div>
        );
      })()}

      {/* 3. CABEÇALHO DA SEÇÃO DE SUB-ROTAS */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Sub-rotas & Módulos:
        </span>

        <button
          type="button"
          onClick={() => {
            setNewSubName("");
            setNewSubMode("low-level");
            setIsAddModalOpen(true);
          }}
          className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <i className="fa-solid fa-plus text-[10px]"></i>
          <span>Nova Rota</span>
        </button>
      </div>

      {/* 4. LISTA DE SUB-ROTAS COM EXPANSÃO/RETRAÇÃO INDEPENDENTE (ACCORDION TEMA CLARO) */}
      <div className="space-y-2.5 mb-4 flex-1">
        {(!workspace?.subProjects || workspace.subProjects.length === 0) && (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 grid place-items-center text-slate-400 mx-auto">
              <i className="fa-solid fa-route text-xs"></i>
            </div>
            <div className="text-xs font-bold text-slate-700">Nenhuma Rota Cadastrada</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Este workspace está totalmente vazio. Clique no botão abaixo para adicionar uma rota ou módulo.
            </p>
            <button
              type="button"
              onClick={() => {
                setNewSubName("");
                setNewSubMode("low-level");
                setIsAddModalOpen(true);
              }}
              className="mt-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <i className="fa-solid fa-plus text-[10px]"></i>
              <span>Criar Rota Agora</span>
            </button>
          </div>
        )}

        {workspace?.subProjects.map((sub) => {
          const isActiveRoute = sub.id === activeSubProjectId;
          const isExpanded = expandedSubIds.has(sub.id);
          const isEditing = editingSubId === sub.id;
          const isSubLowLevel = sub.mode === "low-level";

          return (
            <div
              key={sub.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isActiveRoute
                  ? "bg-white border-indigo-400 ring-2 ring-indigo-500/10 shadow-sm"
                  : "bg-slate-50/70 border-slate-200 hover:border-slate-300"
              }`}
            >
              {/* CABEÇALHO DA ROTA (INTERATIVO COM CLIQUE DE SELEÇÃO E TOGGLE INDEPENDENTE) */}
              <div
                onClick={() => !isEditing && handleSelectRouteHeader(sub.id)}
                className={`p-3 flex items-center justify-between cursor-pointer group transition-colors ${
                  isActiveRoute ? "bg-indigo-50/40" : "hover:bg-slate-100/70"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Botão de Toggle Independente */}
                  <button
                    type="button"
                    onClick={(e) => toggleExpandSubProject(sub.id, e)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
                    title={isExpanded ? "Recolher opções desta rota" : "Expandir opções desta rota"}
                  >
                    <i
                      className={`fa-solid ${isExpanded ? "fa-chevron-down text-indigo-600" : "fa-chevron-right text-slate-400"} text-[11px]`}
                    ></i>
                  </button>

                  {/* Ícone de Modo */}
                  <div
                    className={`w-6 h-6 rounded-md grid place-items-center text-[10px] shrink-0 font-bold ${
                      isSubLowLevel
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "bg-violet-50 text-violet-700 border border-violet-200"
                    }`}
                    title={isSubLowLevel ? "Baixo Nível" : "Alto Nível"}
                  >
                    <i
                      className={`fa-solid ${isSubLowLevel ? "fa-code" : "fa-sitemap"}`}
                    ></i>
                  </div>

                  {/* Nome da Rota / Input de Edição */}
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
                      className="bg-white text-slate-900 text-xs px-2 py-1 rounded border border-indigo-500 focus:outline-none w-full shadow-xs"
                    />
                  ) : (
                    <div className="min-w-0 flex-1">
                      <span
                        className={`text-xs font-bold block truncate ${
                          isActiveRoute ? "text-indigo-950" : "text-slate-800 group-hover:text-slate-950"
                        }`}
                        title={sub.name}
                      >
                        {sub.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Ações da Rota (Editar, Duplicar, Excluir - Sempre Visíveis) */}
                {!isEditing && (
                  <div className="flex items-center gap-1.5 ml-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleStartRename(sub, e)}
                      className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded cursor-pointer"
                      title="Renomear rota"
                    >
                      <i className="fa-solid fa-pen text-[10px]"></i>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateSubProject(sub.id);
                      }}
                      className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                      title="Duplicar rota"
                    >
                      <i className="fa-solid fa-copy text-[10px]"></i>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSubProject(sub.id);
                      }}
                      className="p-1 text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white rounded transition-colors cursor-pointer"
                      title="Excluir rota"
                    >
                      <i className="fa-solid fa-trash-can text-[10px]"></i>
                    </button>
                  </div>
                )}
              </div>

              {/* CONTEÚDO EXPANDIDO INDEPENDENTE DA ROTA (TEMA CLÁSSICO BRANCO) */}
              {isExpanded && (
                <div className="p-3.5 space-y-3.5 border-t border-slate-100 bg-white animate-fadeIn">
                  {/* Exibição do Tipo / Nível de Arquitetura da Rota (Apenas o tipo pertencente) */}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Nível de Arquitetura da Rota:
                    </label>
                    {isSubLowLevel ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/80 border border-blue-200/80 text-blue-900 text-xs font-bold">
                        <i className="fa-solid fa-code text-blue-600 text-xs"></i>
                        <span>Baixo Nível</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50/80 border border-violet-200/80 text-violet-900 text-xs font-bold">
                        <i className="fa-solid fa-sitemap text-violet-600 text-xs"></i>
                        <span>Alto Nível</span>
                      </div>
                    )}
                  </div>

                  {/* Casos de Borda Checkbox (Apenas para Baixo Nível) */}
                  {isSubLowLevel && (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-triangle-exclamation text-amber-600 text-xs"></i>
                        <div>
                          <div className="text-xs font-bold text-amber-950">
                            Mapear Casos de Borda
                          </div>
                          <div className="text-[10px] text-amber-700">
                            Simular timeouts, rate-limit e 500
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={includeEdgeCases}
                        onChange={(e) => {
                          if (!isActiveRoute) onSelectSubProject(sub.id);
                          setIncludeEdgeCases(e.target.checked);
                        }}
                        className="w-4 h-4 accent-amber-600 cursor-pointer"
                      />
                    </div>
                  )}

                  {/* Botão de Importação de Arquivo */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Importar Arquivo / Especificação:
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isActiveRoute) onSelectSubProject(sub.id);
                          fileInputRef.current?.click();
                        }}
                        className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
                      >
                        Swagger / Postman ↗
                      </button>
                    </div>

                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".json,.yaml,.yml,.ts,.js,.java,.cs,.py,.txt"
                      onChange={handleFileChange}
                    />

                    {fileBadge && (
                      <div className="flex items-center justify-between px-2.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-xs text-indigo-700 mt-1">
                        <span className="truncate max-w-[220px] font-medium" title={fileBadge}>
                          <i className="fa-solid fa-circle-check text-emerald-500 mr-1.5"></i>
                          {fileBadge}
                        </span>
                        <button
                          type="button"
                          onClick={handleClearFile}
                          className="text-indigo-400 hover:text-indigo-700 font-bold ml-1 cursor-pointer"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Textarea Prompt / Código da Rota */}
                  <div
                    className={`relative rounded-xl transition-all ${
                      isDragging ? "ring-2 ring-indigo-500 bg-indigo-50/50" : ""
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <label
                      htmlFor={`promptInput-${sub.id}`}
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1"
                    >
                      {isSubLowLevel ? "Código ou Contrato da Rota" : "Descrição da Arquitetura"}
                    </label>

                    <textarea
                      id={`promptInput-${sub.id}`}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none transition-all focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 min-h-[140px] leading-relaxed resize-none placeholder:text-slate-400"
                      placeholder={
                        isSubLowLevel
                          ? "Cole a descrição/código desta rota OU arraste um arquivo Swagger, Postman ou Insomnia (.json) aqui..."
                          : "Cole a descrição da arquitetura desta rota..."
                      }
                      value={isActiveRoute ? promptInput : sub.lowLevelPrompt || sub.agentPrompt || ""}
                      onChange={(e) => {
                        if (!isActiveRoute) onSelectSubProject(sub.id);
                        setPromptInput(e.target.value);
                      }}
                      onFocus={() => {
                        if (!isActiveRoute) onSelectSubProject(sub.id);
                      }}
                    ></textarea>

                    {isDragging && (
                      <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-xs border-2 border-dashed border-indigo-600 rounded-xl flex flex-col items-center justify-center text-indigo-700 font-bold text-xs pointer-events-none">
                        <i className="fa-solid fa-cloud-arrow-up text-2xl mb-1"></i>
                        Solte o arquivo para importar!
                      </div>
                    )}
                  </div>

                  {/* Botão Gerar Rota */}
                  <button
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs cursor-pointer flex justify-center items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                    onClick={() => {
                      if (!isActiveRoute) onSelectSubProject(sub.id);
                      onGenerate();
                    }}
                    disabled={isLoading}
                  >
                    {!isLoading ? (
                      <>
                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                        <span>{isSubLowLevel ? "Gerar Fluxo da Rota" : "Gerar Arquitetura"}</span>
                      </>
                    ) : (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    )}
                  </button>

                  {/* Status Msg */}
                  {isActiveRoute && statusMsg && (
                    <div className="text-[11px] text-slate-500 text-center animate-fadeIn font-medium">
                      {statusMsg}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL DE ADIÇÃO RÁPIDA DE ROTA */}
      {isAddModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs grid place-items-center p-4 animate-fadeIn">
            <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <i className="fa-solid fa-plus-circle text-indigo-600"></i>
                  Adicionar Nova Rota ao Workspace
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateSubProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome da Rota ou Módulo:
                  </label>
                  <input
                    type="text"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    placeholder="Ex: POST /v1/payments/pix ou GET /v1/users"
                    autoFocus
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Modo de Arquitetura:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewSubMode("low-level")}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        newSubMode === "low-level"
                          ? "bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-500/20"
                          : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <i className="fa-solid fa-code text-indigo-600"></i>
                      <span>Baixo Nível</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewSubMode("high-level")}
                      className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        newSubMode === "high-level"
                          ? "bg-violet-50 border-violet-500 text-violet-900 ring-2 ring-violet-500/20"
                          : "bg-white border-slate-200 text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <i className="fa-solid fa-sitemap text-violet-600"></i>
                      <span>Alto Nível</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Criar Rota
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </aside>
  );
}
