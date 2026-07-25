import { AgentPromptViewer } from "./AgentPromptViewer";

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: "mermaid" | "reactflow" | "excalidraw";
  agentPrompt?: string;
  showCodeEditor: boolean;
  setShowCodeEditor: (show: boolean) => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onDownloadSvg?: () => void;
  onAnalyzeDrawing?: () => void;
  isLoading?: boolean;
}

export function RightSidebar({
  isOpen,
  onClose,
  viewMode,
  agentPrompt,
  showCodeEditor,
  setShowCodeEditor,
  isFullscreen,
  toggleFullscreen,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onDownloadSvg,
  onAnalyzeDrawing,
  isLoading,
}: RightSidebarProps) {
  if (!isOpen) return null;

  const viewLabels = {
    mermaid: "Diagrama Mermaid",
    reactflow: "Editor Interativo",
    excalidraw: "Desenho Livre",
  };

  return (
    <>
      {/* Backdrop overlay para dispositivos móveis (< 1024px) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden cursor-pointer transition-opacity"
        title="Fechar painel lateral"
      />

      <aside className="fixed inset-y-0 right-0 z-50 w-[85vw] max-w-[360px] lg:relative lg:w-[360px] lg:z-20 shrink-0 bg-white border-l border-slate-200 flex flex-col shadow-2xl lg:shadow-none transition-all duration-300 overflow-hidden h-full">
        {/* Top Header do Painel */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white grid place-items-center text-xs shadow-xs">
              <i className="fa-solid fa-sliders"></i>
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Ações & Prompt
              </h2>
              <span className="text-[10px] text-slate-500 font-medium">
                {viewLabels[viewMode]}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            title="Fechar Painel Lateral"
          >
            <i className="fa-solid fa-xmark text-xs"></i>
          </button>
        </div>

        {/* Conteúdo Principal com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* SEÇÃO 1: Ferramentas & Ações da Visualização */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Ferramentas da Visão
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                {viewMode}
              </span>
            </div>

            {/* Ações Específicas: Mermaid */}
            {viewMode === "mermaid" && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onZoomIn}
                  className="px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                  title="Aumentar Zoom (+)"
                >
                  <i className="fa-solid fa-magnifying-glass-plus text-slate-500"></i>
                  <span>Zoom In</span>
                </button>

                <button
                  type="button"
                  onClick={onZoomOut}
                  className="px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                  title="Diminuir Zoom (-)"
                >
                  <i className="fa-solid fa-magnifying-glass-minus text-slate-500"></i>
                  <span>Zoom Out</span>
                </button>

                <button
                  type="button"
                  onClick={onResetZoom}
                  className="col-span-2 px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 text-slate-700 hover:text-indigo-600 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                  title="Centralizar e resetar zoom"
                >
                  <i className="fa-solid fa-arrows-to-dot text-slate-500"></i>
                  <span>Resetar Visão</span>
                </button>

                {onDownloadSvg && (
                  <button
                    type="button"
                    onClick={onDownloadSvg}
                    className="col-span-2 px-3 py-2 border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                    title="Baixar diagrama no formato SVG"
                  >
                    <i className="fa-solid fa-download text-indigo-600"></i>
                    <span>Baixar Diagrama SVG</span>
                  </button>
                )}
              </div>
            )}

            {/* Ações Específicas: Excalidraw */}
            {viewMode === "excalidraw" && onAnalyzeDrawing && (
              <div>
                <button
                  type="button"
                  onClick={onAnalyzeDrawing}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3 border border-indigo-600 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Analisando Desenho...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-wand-magic-sparkles"></i>
                      <span>Analisar Desenho com IA</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Ações Específicas: React Flow */}
            {viewMode === "reactflow" && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed flex items-center gap-2">
                <i className="fa-solid fa-circle-info text-indigo-500 text-sm shrink-0"></i>
                <span>
                  Edite nós e conexões arrastando os elementos na tela.
                </span>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* SEÇÃO 2: Controles Globais do Canvas */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Controles do Canvas
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowCodeEditor(!showCodeEditor)}
                className={`px-3 py-2 border rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs ${
                  showCodeEditor
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                }`}
                title="Abrir/Fechar Editor de Código Mermaid"
              >
                <i className="fa-solid fa-code"></i>
                <span>{showCodeEditor ? "Ocultar Código" : "Ver Código"}</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
              >
                <i
                  className={`fa-solid ${
                    isFullscreen ? "fa-compress" : "fa-expand"
                  }`}
                ></i>
                <span>{isFullscreen ? "Sair Fullscreen" : "Tela Cheia"}</span>
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* SEÇÃO 3: Card "Prompt Gerado" */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Prompt Gerado pela IA
              </span>
              {agentPrompt && (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-600 rounded-full border border-emerald-200">
                  Disponível
                </span>
              )}
            </div>

            {agentPrompt ? (
              <AgentPromptViewer prompt={agentPrompt} />
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-center">
                <i className="fa-solid fa-robot text-slate-300 text-2xl mb-2 block"></i>
                <p className="text-xs text-slate-500">
                  Nenhum prompt foi gerado ainda. Gere um diagrama com a IA para visualizar o prompt do agente.
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
