import { useState } from "react";
import type { Project } from "../types/project";
import type { LLMConfig } from "../types/llm";
import { getActiveLLMKey, getActiveLLMModel, LLM_PROVIDERS } from "../utils/llmStorage";

interface DashboardViewProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onEditProject: (project: Project) => void;
  onDuplicateProject: (projectId: string) => void;
  onDeleteProject: (workspace: Project) => void;
  llmConfig: LLMConfig;
  onOpenLLMConfig: () => void;
}

export function DashboardView({
  projects,
  onSelectProject,
  onCreateProject,
  onEditProject,
  onDuplicateProject,
  onDeleteProject,
  llmConfig,
  onOpenLLMConfig,
}: DashboardViewProps) {
  // Aba de Origem: "personal" (padrão) | "examples" | "all"
  const [activeTab, setActiveTab] = useState<"personal" | "examples" | "all">(
    "personal",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [modeFilter, setModeFilter] = useState<
    "all" | "low-level" | "high-level"
  >("all");
  // Separação de Projetos
  const personalProjects = projects.filter((p) => !p.isExample);
  const exampleProjects = projects.filter((p) => !!p.isExample);

  // Lista Filtrada
  const filteredProjects = projects.filter((p) => {
    // Filtro por Aba Principal
    if (activeTab === "personal" && p.isExample) return false;
    if (activeTab === "examples" && !p.isExample) return false;

    // Filtro por Busca por Texto
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    // Filtro por Modo de Arquitetura
    const matchesMode =
      modeFilter === "all"
        ? true
        : p.subProjects?.some((sub) => sub.mode === modeFilter);

    return matchesSearch && matchesMode;
  });

  // Métricas Globais Restritas aos Projetos Pessoais do Usuário
  const personalCount = personalProjects.length;
  const examplesCount = exampleProjects.length;
  const lowLevelPersonalCount = personalProjects.filter((p) =>
    p.subProjects?.some((sub) => sub.mode === "low-level")
  ).length;
  const highLevelPersonalCount = personalProjects.filter((p) =>
    p.subProjects?.some((sub) => sub.mode === "high-level")
  ).length;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recente";
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* CABEÇALHO DA DASHBOARD */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        {/* Logo & Título */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 text-white w-10 h-10 rounded-xl grid place-items-center text-xl font-extrabold shadow-md shadow-indigo-500/20">
            ✨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-xl tracking-tight">
                archM
              </span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold tracking-wide uppercase">
                Dashboard
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Central de Gestão & Engenharia de Arquitetura de Software com IA
            </p>
          </div>
        </div>

        {/* Ações de Topo: Config do Provedor LLM + Botão Criar Projeto */}
        <div className="flex items-center gap-3">
          {/* Badge de Configuração do Provedor de IA */}
          {(() => {
            const activeKey = getActiveLLMKey(llmConfig);
            const activeProviderInfo = LLM_PROVIDERS[llmConfig.activeProvider];
            const activeModel = getActiveLLMModel(llmConfig);
            const hasKey = !!activeKey.trim();

            return (
              <button
                type="button"
                onClick={onOpenLLMConfig}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer shadow-2xs ${
                  hasKey
                    ? "bg-slate-900 border-slate-800 text-white hover:bg-slate-800"
                    : "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100"
                }`}
                title={`Provedor Ativo: ${activeProviderInfo.name} (${activeModel})`}
              >
                <i className={`${activeProviderInfo.icon} text-sm ${hasKey ? "text-indigo-400" : "text-amber-600"}`}></i>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5 leading-tight">
                    <span>{activeProviderInfo.name}</span>
                    <span className={`w-1.5 h-1.5 rounded-full ${hasKey ? "bg-emerald-400" : "bg-amber-400"}`}></span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                    {activeModel}
                  </span>
                </div>
                <i className="fa-solid fa-chevron-down text-[10px] text-slate-400 ml-1"></i>
              </button>
            );
          })()}

          {/* Botão + Novo Projeto */}
          <button
            type="button"
            onClick={onCreateProject}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-plus text-sm"></i>
            <span>Novo Projeto</span>
          </button>
        </div>
      </header>

      {/* ÁREA DE CONTEÚDO DA DASHBOARD */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* CARDS DE MÉTRICAS (RESTRITOS AOS PROJETOS PESSOAIS DO USUÁRIO) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div
            onClick={() => setActiveTab("personal")}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between group hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Projetos Pessoais
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {personalCount}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center text-lg font-bold group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-folder-closed"></i>
            </div>
          </div>

          <div
            onClick={() => setActiveTab("examples")}
            className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between group hover:border-indigo-300 cursor-pointer transition-all"
          >
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Exemplos Prontos
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {examplesCount}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 grid place-items-center text-lg font-bold group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-lightbulb"></i>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between group hover:border-indigo-200 transition-all">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Minhas APIs (Baixo Nível)
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {lowLevelPersonalCount}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 grid place-items-center text-lg font-bold group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-code"></i>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between group hover:border-indigo-200 transition-all">
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Meus Sistemas (Alto Nível)
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                {highLevelPersonalCount}
              </h3>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 grid place-items-center text-lg font-bold group-hover:scale-110 transition-transform">
              <i className="fa-solid fa-sitemap"></i>
            </div>
          </div>
        </div>

        {/* NAVEGAÇÃO DE SEÇÃO (ABAS PRINCIPAIS: MEUS PROJETOS VS EXEMPLOS PRONTOS) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-3">
          {/* Abas Principais */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === "personal"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <i className="fa-solid fa-user-gear"></i>
              <span>Meus Projetos Pessoais</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === "personal"
                    ? "bg-indigo-700 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {personalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("examples")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                activeTab === "examples"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              <i className="fa-solid fa-lightbulb"></i>
              <span>Exemplos & Templates Prontos</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === "examples"
                    ? "bg-amber-700 text-white"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {examplesCount}
              </span>
            </button>
          </div>

          {/* Filtro por Modo de Arquitetura */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1 items-center shrink-0 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setModeFilter("all")}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                modeFilter === "all"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Todos os Níveis
            </button>
            <button
              type="button"
              onClick={() => setModeFilter("low-level")}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                modeFilter === "low-level"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <i className="fa-solid fa-code text-[10px]"></i>
              <span>Baixo Nível</span>
            </button>
            <button
              type="button"
              onClick={() => setModeFilter("high-level")}
              className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                modeFilter === "high-level"
                  ? "bg-white text-violet-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <i className="fa-solid fa-sitemap text-[10px]"></i>
              <span>Alto Nível</span>
            </button>
          </div>
        </div>

        {/* BARRA DE PESQUISA */}
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar projetos por nome, tecnologia ou tags (ex: Pix, Kafka, OAuth2, Redis)..."
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400 shadow-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* GRID DE PROJETOS */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProjects.map((proj) => {
              const activeSub = proj.subProjects?.find((s) => s.id === proj.activeSubProjectId) || proj.subProjects?.[0];
              const isLowLevel = activeSub ? activeSub.mode === "low-level" : true;
              const isExample = !!proj.isExample;

              return (
                <div
                  key={proj.id}
                  className={`bg-white rounded-2xl border shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group ${
                    isExample
                      ? "border-amber-200/80 hover:border-amber-400"
                      : "border-slate-200/80 hover:border-indigo-300"
                  }`}
                >
                  {/* Card Header & Badges */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-lg shrink-0 group-hover:scale-105 transition-transform ${
                            isExample
                              ? "bg-amber-50 border-amber-200 text-amber-600"
                              : "bg-indigo-50 border-indigo-100 text-indigo-600"
                          }`}
                        >
                          <i
                            className={`fa-solid ${proj.icon || (isLowLevel ? "fa-code" : "fa-sitemap")}`}
                          ></i>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 justify-end">
                          {/* Badge Origem: Exemplo vs Pessoal */}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border tracking-wider ${
                              isExample
                                ? "bg-amber-100/70 border-amber-300 text-amber-900"
                                : "bg-indigo-100/70 border-indigo-300 text-indigo-900"
                            }`}
                          >
                            {isExample ? "Exemplo Prático" : "Meu Projeto"}
                          </span>

                          {/* Badge Modo */}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              isLowLevel
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : "bg-violet-50 border-violet-200 text-violet-700"
                            }`}
                          >
                            {isLowLevel ? "Baixo Nível" : "Alto Nível"}
                          </span>

                          {/* Botão de Exclusão Direta no Topo do Card (Sempre Visível) */}
                          {!isExample && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteProject(proj);
                              }}
                              className="px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-600 hover:text-white transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-2xs ml-1"
                              title="Excluir Workspace Permanentemente"
                            >
                              <i className="fa-solid fa-trash-can text-xs"></i>
                              <span className="text-[10px]">Excluir</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <h3
                        onClick={() => onSelectProject(proj)}
                        className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors cursor-pointer line-clamp-1"
                        title={proj.name}
                      >
                        {proj.name}
                      </h3>

                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {proj.description || "Sem descrição cadastrada."}
                      </p>
                    </div>

                    {/* Tags e Info */}
                    <div className="space-y-2.5 pt-2">
                      <div className="flex flex-wrap gap-1.5">
                        {proj.tags?.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200/60 text-slate-600 text-[10px] font-mono"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-100">
                        <span className="flex items-center gap-1.5 font-bold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-lg border border-indigo-100/80">
                          <i className="fa-solid fa-layer-group text-indigo-500"></i>
                          {proj.subProjects?.length || 1} {proj.subProjects?.length === 1 ? "Sub-projeto / Rota" : "Sub-projetos / Rotas"}
                        </span>
                        <span
                          className="flex items-center gap-1 text-slate-400"
                          title="Última Modificação"
                        >
                          <i className="fa-regular fa-clock"></i>
                          {formatDate(proj.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="bg-slate-50/60 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                    {/* Para projetos pessoais: Editar, Duplicar, Excluir */}
                    {!isExample ? (
                      <>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEditProject(proj)}
                            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white border border-slate-200/60 transition-colors cursor-pointer text-xs"
                            title="Editar Informações do Projeto"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateProject(proj.id)}
                            className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-white border border-slate-200/60 transition-colors cursor-pointer text-xs"
                            title="Duplicar Projeto"
                          >
                            <i className="fa-solid fa-copy"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProject(proj)}
                            className="p-2 rounded-lg text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                            title="Excluir Workspace Permanentemente"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onSelectProject(proj)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Abrir Workspace</span>
                          <i className="fa-solid fa-arrow-right text-[10px]"></i>
                        </button>
                      </>
                    ) : (
                      /* Para Exemplos Prontos: Botão Usar como Base / Duplicar para Pessoal */
                      <div className="w-full flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectProject(proj)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white transition-all cursor-pointer flex items-center gap-1.5"
                          title="Visualizar este exemplo"
                        >
                          <i className="fa-solid fa-eye text-slate-500"></i>
                          <span>Ver Exemplo</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onDuplicateProject(proj.id)}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-600 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                          title="Copiar este exemplo para a sua área de Projetos Pessoais"
                        >
                          <i className="fa-solid fa-copy"></i>
                          <span>Usar como Base</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ESTADO VAZIO (NENHUM PROJETO NA ABA ATIVA) */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center flex flex-col items-center justify-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold">
              <i
                className={
                  activeTab === "personal"
                    ? "fa-solid fa-folder-plus"
                    : "fa-solid fa-folder-open"
                }
              ></i>
            </div>
            <div className="max-w-md">
              <h3 className="font-bold text-slate-900 text-lg">
                {activeTab === "personal"
                  ? "Você ainda não possui projetos pessoais criados"
                  : "Nenhum projeto encontrado nesta visualização"}
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                {activeTab === "personal"
                  ? "Crie seu próprio projeto de arquitetura do zero ou duplique um dos modelos de exemplo prontos para começar."
                  : searchTerm
                    ? `Nenhum projeto corresponde ao termo de busca "${searchTerm}".`
                    : "Nenhum projeto disponível no filtro selecionado."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {activeTab === "personal" && (
                <>
                  <button
                    onClick={onCreateProject}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Criar Novo Projeto</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("examples")}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <i className="fa-solid fa-lightbulb text-amber-600"></i>
                    <span>Explorar Exemplos Prontos</span>
                  </button>
                </>
              )}

              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Limpar Filtros de Busca
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
