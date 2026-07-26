import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import svgPanZoom from "svg-pan-zoom";
import { NodeModal, type InspectorNode } from "./NodeModal";
import { ReactFlowView } from "./ReactFlowView";
import { ExcalidrawView, type ExcalidrawViewRef } from "./ExcalidrawView";
import { RightSidebar } from "./RightSidebar";
import {
  renderMermaidWithFallback,
  type FallbackInfo,
} from "../utils/mermaidFallback";

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  securityLevel: "loose",
});

interface DiagramCanvasProps {
  mermaidCode: string;
  mermaidSequenceCode?: string;
  mode?: "low-level" | "high-level";
  nodesMetadata?: Record<string, any>;
  agentPrompt?: string;
  onError: (msg: string) => void;
  onRenderSuccess: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onMermaidCodeChange?: (newCode: string) => void;
  onMermaidSequenceCodeChange?: (newCode: string) => void;
  onAnalyzeDrawing?: (base64Image: string) => void;
  onRegenerateGraphOnly?: (brokenCode: string, errorMsg: string) => void;
  isLoading?: boolean;
  onReturnToDashboard?: () => void;
  projectName?: string;
}

export function DiagramCanvas({
  mermaidCode,
  mermaidSequenceCode,
  mode,
  nodesMetadata,
  agentPrompt,
  onError,
  onRenderSuccess,
  isSidebarOpen,
  setIsSidebarOpen,
  onMermaidCodeChange,
  onMermaidSequenceCodeChange,
  onAnalyzeDrawing,
  onRegenerateGraphOnly,
  isLoading,
  projectName,
}: DiagramCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const panZoomInstance = useRef<any>(null);
  const excalidrawRef = useRef<ExcalidrawViewRef>(null);

  const [viewMode, setViewMode] = useState<
    "mermaid" | "reactflow" | "excalidraw"
  >("mermaid");
  const [mermaidSubMode, setMermaidSubMode] = useState<
    "flowchart" | "sequence"
  >("flowchart");
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [editableCode, setEditableCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<InspectorNode | null>(null);
  const [fallbackInfo, setFallbackInfo] = useState<FallbackInfo | null>(null);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  const isLowLevel = mode === "low-level";
  const activeMermaidCode =
    mermaidSubMode === "sequence" ? mermaidSequenceCode || "" : mermaidCode;

  useEffect(() => {
    if (agentPrompt) {
      setIsRightSidebarOpen(true);
    }
  }, [agentPrompt]);

  useEffect(() => {
    if (mermaidSubMode === "sequence" && viewMode === "reactflow") {
      setViewMode("mermaid");
    }
  }, [mermaidSubMode, viewMode]);

  useEffect(() => {
    setEditableCode(activeMermaidCode);
  }, [activeMermaidCode]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (mainRef.current?.requestFullscreen) {
        mainRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const attachNodeClickListeners = () => {
    if (!containerRef.current) return;
    const svgElement = containerRef.current.querySelector("svg");
    if (!svgElement) return;

    const nodeElements = svgElement.querySelectorAll(
      "g.node, .node, g.actor, .actor",
    );
    nodeElements.forEach((nodeEl: Element) => {
      const htmlEl = nodeEl as HTMLElement;
      htmlEl.style.cursor = "pointer";

      htmlEl.addEventListener("click", (e: MouseEvent) => {
        e.stopPropagation();

        nodeElements.forEach(
          (el) => ((el as HTMLElement).style.filter = "none"),
        );
        htmlEl.style.filter = "drop-shadow(0 0 6px rgba(99, 102, 241, 0.8))";

        const svgNodeId = htmlEl.id || "";
        const fullText = (htmlEl.textContent || "").trim();

        let matchedMetadata: InspectorNode | null = null;

        if (nodesMetadata) {
          for (const [key, data] of Object.entries(nodesMetadata)) {
            if (
              svgNodeId.includes(key) ||
              key.toLowerCase().includes(svgNodeId.toLowerCase()) ||
              fullText
                .toLowerCase()
                .includes(data.label?.toLowerCase() || key.toLowerCase())
            ) {
              matchedMetadata = {
                id: key,
                label: data.label || fullText,
                category: data.category || "Componente",
                icon: data.icon || "fa-gears",
                colorClass:
                  data.colorClass ||
                  "bg-indigo-100 text-indigo-800 border-indigo-200",
                headers: data.headers || ["Content-Type: application/json"],
                dtoSample:
                  typeof data.dtoSample === "object"
                    ? JSON.stringify(data.dtoSample, null, 2)
                    : data.dtoSample || "{}",
                codeSnippet:
                  data.codeSnippet || "// Trecho de código não informado",
                expectedInput: data.expectedInput,
                expectedOutput: data.expectedOutput,
              };
              break;
            }
          }
        }

        if (!matchedMetadata) {
          matchedMetadata = {
            id: svgNodeId,
            label: fullText,
            category: "Bloco de Processamento",
            icon: "fa-gears",
            colorClass: "bg-slate-100 text-slate-800 border-slate-200",
            headers: ["Content-Type: application/json"],
            dtoSample: JSON.stringify({ nodeText: fullText }, null, 2),
            codeSnippet: `// Implementação: ${fullText}`,
          };
        }

        setSelectedNode(matchedMetadata);
      });
    });
  };

  const renderDiagram = async (codeToRender: string) => {
    if (!codeToRender) return;

    try {
      if (panZoomInstance.current) {
        panZoomInstance.current.destroy();
        panZoomInstance.current = null;
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }

      const id = `mermaid-svg-${Date.now()}`;
      const {
        svg,
        fallbackInfo: fbInfo,
        finalCode,
      } = await renderMermaidWithFallback(id, codeToRender);

      setFallbackInfo(fbInfo);
      if (fbInfo && finalCode !== codeToRender) {
        setEditableCode(finalCode);
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = svg;
        const svgElement = containerRef.current.querySelector("svg");

        if (svgElement) {
          svgElement.style.width = "100%";
          svgElement.style.height = "100%";
          svgElement.style.maxWidth = "none";

          panZoomInstance.current = svgPanZoom(svgElement, {
            zoomEnabled: true,
            controlIconsEnabled: false,
            fit: true,
            center: true,
            minZoom: 0.2,
            maxZoom: 5,
            zoomScaleSensitivity: 0.2,
          });

          attachNodeClickListeners();
        }
      }

      onRenderSuccess();
    } catch (e: any) {
      setFallbackInfo(null);
      onError(
        `Erro de sintaxe no Mermaid: ${e.message}\n\nCódigo Atual:\n${codeToRender}`,
      );
    }
  };

  useEffect(() => {
    if (viewMode === "mermaid") {
      if (activeMermaidCode) {
        renderDiagram(activeMermaidCode);
        setSelectedNode(null);
      } else {
        if (panZoomInstance.current) {
          panZoomInstance.current.destroy();
          panZoomInstance.current = null;
        }
        if (containerRef.current) {
          containerRef.current.innerHTML = "";
        }
        setFallbackInfo(null);
        setSelectedNode(null);
      }
    }
  }, [activeMermaidCode, viewMode]);

  const handleSaveFromReactFlow = (newMermaidCode: string) => {
    setEditableCode(newMermaidCode);
    if (onMermaidCodeChange) {
      onMermaidCodeChange(newMermaidCode);
    }
    renderDiagram(newMermaidCode);
  };

  const handleApplyManualEdit = () => {
    if (mermaidSubMode === "sequence") {
      if (onMermaidSequenceCodeChange) {
        onMermaidSequenceCodeChange(editableCode);
      }
    } else {
      if (onMermaidCodeChange) {
        onMermaidCodeChange(editableCode);
      }
    }
    renderDiagram(editableCode);
  };

  const handleCopyCode = () => {
    if (!editableCode) return;
    navigator.clipboard.writeText(editableCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleZoomIn = () => panZoomInstance.current?.zoomIn();
  const handleZoomOut = () => panZoomInstance.current?.zoomOut();
  const handleResetZoom = () => {
    if (panZoomInstance.current) {
      panZoomInstance.current.resetZoom();
      panZoomInstance.current.center();
    }
  };

  const handleDownload = () => {
    const svgElement = containerRef.current?.querySelector("svg");
    if (!svgElement) return alert("Nenhum diagrama para baixar!");

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(
        /^<svg/,
        '<svg xmlns="http://www.w3.org/2000/svg"',
      );
    }

    const svgBlob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement("a");

    downloadLink.href = svgUrl;
    downloadLink.download = "arquitetura-api.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  return (
    <main
      ref={mainRef}
      className="flex-1 relative flex flex-col bg-slate-50 overflow-hidden h-full w-full"
    >
      {/* CABEÇALHO SUPERIOR FIXO UNIFICADO (CLEAN UI) */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-4 shrink-0 flex items-center justify-between gap-3 relative z-30 shadow-2xs select-none">
        {/* Esquerda: Botão Menu (quando recolhido) + Breadcrumb do Projeto */}
        <div className="flex items-center gap-2.5 min-w-0">
          {!isSidebarOpen && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 px-2.5 py-1.5 rounded-xl shadow-2xs flex items-center gap-2 text-xs font-bold cursor-pointer transition-all h-9 shrink-0"
              title="Abrir Menu Lateral"
            >
              <i className="fa-solid fa-bars text-xs"></i>
              <span className="hidden sm:inline">Menu</span>
            </button>
          )}

          {projectName && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 h-9 truncate shadow-2xs"
              title={projectName}
            >
              <i className="fa-solid fa-layer-group text-indigo-600 text-xs shrink-0"></i>
              <span className="truncate max-w-[180px] sm:max-w-xs">{projectName}</span>
            </div>
          )}
        </div>

        {/* Centro: Controles Unificados de Visualização (Diagrama | React Flow | Excalidraw) */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200/80 flex items-center gap-1 h-9 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("mermaid")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 h-7 shrink-0 ${
                viewMode === "mermaid"
                  ? "bg-white text-indigo-600 shadow-2xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <i className="fa-solid fa-diagram-project text-xs"></i>
              <span className="hidden md:inline">Mermaid</span>
            </button>

            {mermaidSubMode !== "sequence" && (
              <button
                type="button"
                onClick={() => setViewMode("reactflow")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 h-7 shrink-0 ${
                  viewMode === "reactflow"
                    ? "bg-white text-indigo-600 shadow-2xs border border-slate-200/60"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <i className="fa-solid fa-vector-square text-xs"></i>
                <span className="hidden md:inline">React Flow</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setViewMode("excalidraw")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 h-7 shrink-0 ${
                viewMode === "excalidraw"
                  ? "bg-white text-indigo-600 shadow-2xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <i className="fa-solid fa-pen-ruler text-xs"></i>
              <span className="hidden md:inline">Excalidraw</span>
            </button>

            {/* Sub-seletor Mermaid: Fluxograma TD vs Sequência */}
            {viewMode === "mermaid" && (isLowLevel || !!mermaidSequenceCode) && (
              <>
                <div className="h-4 w-px bg-slate-300 mx-0.5"></div>

                <button
                  type="button"
                  onClick={() => setMermaidSubMode("flowchart")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 h-7 ${
                    mermaidSubMode === "flowchart"
                      ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Ver Fluxograma (TD)"
                >
                  <i className="fa-solid fa-sitemap text-[11px]"></i>
                  <span className="hidden lg:inline">Fluxograma</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMermaidSubMode("sequence")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 h-7 ${
                    mermaidSubMode === "sequence"
                      ? "bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="Ver Diagrama de Sequência"
                >
                  <i className="fa-solid fa-list-ol text-[11px]"></i>
                  <span className="hidden lg:inline">Sequência</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Direita: Ações & Prompt */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
            className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs ${
              isRightSidebarOpen
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600"
            }`}
            title="Alternar Painel de Inspeção e Prompt do Agente"
          >
            <i className="fa-solid fa-sliders text-xs"></i>
            <span className="hidden sm:inline">Ações & Prompt</span>
            {agentPrompt && (
              <span
                className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                title="Prompt Gerado Disponível"
              ></span>
            )}
          </button>
        </div>
      </header>

      {/* BANNER INFORMATIVO DE FALLBACK AUTOMÁTICO DO GRÁFICO */}
      {fallbackInfo && (
        <div className="bg-amber-50 border-b border-amber-200 px-3 sm:px-4 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 z-30 text-xs text-amber-900 shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
              <i className="fa-solid fa-triangle-exclamation text-sm"></i>
            </div>
            <div>
              <div className="font-bold text-amber-950 flex flex-wrap items-center gap-1.5">
                <span>Fallback Automático Aplicado</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900 text-[10px] font-mono">
                  {fallbackInfo.strategyUsed}
                </span>
              </div>
              <p className="text-amber-800 text-[11px] truncate max-w-[300px] sm:max-w-md">
                {fallbackInfo.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setShowCodeEditor(true)}
              className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg font-semibold transition-colors text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <i className="fa-solid fa-code"></i>
              <span className="hidden sm:inline">Ver Código Ajustado</span>
              <span className="sm:hidden">Código</span>
            </button>
            {onRegenerateGraphOnly && (
              <button
                type="button"
                onClick={() =>
                  onRegenerateGraphOnly(
                    activeMermaidCode,
                    fallbackInfo.originalError,
                  )
                }
                disabled={isLoading}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span className="hidden sm:inline">Regerar Gráfico com IA</span>
                <span className="sm:hidden">Regerar</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setFallbackInfo(null)}
              className="w-7 h-7 flex items-center justify-center text-amber-700 hover:text-amber-950 font-bold hover:bg-amber-200/50 rounded-lg text-sm cursor-pointer ml-1"
              title="Fechar Aviso"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ÁREA CENTRAL CONTAINER (CANVAS + MENU LATERAL DIREITO) */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex flex-row isolate">
        {/* ÁREA DO CANVAS (CONTAINER FLEX-1) */}
        <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col isolate">
          {/* CONTEÚDO 1: VISÃO MERMAID SVG */}
          {viewMode === "mermaid" && (
            <div
              id="mermaid-wrapper"
              className="w-full h-full overflow-hidden flex justify-center items-center relative"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(100, 116, 139, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 116, 139, 0.1) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            >
              {!activeMermaidCode ? (
                <div className="text-slate-500 text-sm text-center select-none animate-fadeIn">
                  <div className="text-3xl mb-2.5">⌘</div>O diagrama gerado
                  aparecerá aqui.
                </div>
              ) : (
                <div
                  id="mermaid-container"
                  ref={containerRef}
                  className="w-full h-full flex justify-center items-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-none"
                />
              )}
            </div>
          )}

          {/* CONTEÚDO 2: EDITOR INTERATIVO REACT FLOW */}
          {viewMode === "reactflow" && (
            <ReactFlowView
              mermaidCode={editableCode}
              nodesMetadata={nodesMetadata}
              onSaveMermaid={handleSaveFromReactFlow}
            />
          )}

          {/* CONTEÚDO 3: DESENHO LIVRE EXCALIDRAW */}
          {viewMode === "excalidraw" && (
            <ExcalidrawView
              ref={excalidrawRef}
              onAnalyzeDrawing={(base64Image) => {
                if (onAnalyzeDrawing) {
                  onAnalyzeDrawing(base64Image);
                }
              }}
              isLoading={!!isLoading}
            />
          )}

          {/* Modal de Inspeção do Nó no Diagrama Mermaid */}
          {viewMode === "mermaid" && (
            <NodeModal
              node={selectedNode}
              isOpen={!!selectedNode}
              onClose={() => setSelectedNode(null)}
              isEditable={false}
            />
          )}
        </div>

        {/* MENU LATERAL DIREITO (PAINEL DE AÇÕES E PROMPT GERADO) */}
        <RightSidebar
          isOpen={isRightSidebarOpen}
          onClose={() => setIsRightSidebarOpen(false)}
          viewMode={viewMode}
          agentPrompt={agentPrompt}
          showCodeEditor={showCodeEditor}
          setShowCodeEditor={setShowCodeEditor}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onDownloadSvg={handleDownload}
          onAnalyzeDrawing={() => excalidrawRef.current?.analyzeDrawing()}
          isLoading={isLoading}
        />
      </div>

      {/* Editor de Código Mermaid */}
      {showCodeEditor && (
        <div className="absolute bottom-0 left-0 right-0 h-[45vh] max-h-[300px] min-h-[180px] bg-slate-900 border-t border-slate-800 flex flex-col z-30 shadow-2xl transition-all">
          <div className="px-3 sm:px-4 py-2 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <i className="fa-solid fa-code text-indigo-400"></i>
              <span>Editor de Código Mermaid</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <i
                  className={`fa-solid ${
                    copied ? "fa-check text-emerald-400" : "fa-copy"
                  }`}
                ></i>
                <span>{copied ? "Copiado!" : "Copiar Código"}</span>
              </button>

              <button
                type="button"
                onClick={handleApplyManualEdit}
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <i className="fa-solid fa-play"></i>
                <span>Aplicar Alterações</span>
              </button>

              <button
                type="button"
                onClick={() => setShowCodeEditor(false)}
                className="text-slate-400 hover:text-white px-1 text-base cursor-pointer ml-2"
              >
                &times;
              </button>
            </div>
          </div>

          <textarea
            className="flex-1 w-full p-4 bg-slate-900 text-slate-200 font-mono text-xs outline-none resize-none leading-relaxed"
            value={editableCode}
            onChange={(e) => setEditableCode(e.target.value)}
            placeholder="O código Mermaid gerado pela IA aparecerá aqui..."
            spellCheck={false}
          ></textarea>
        </div>
      )}
    </main>
  );
}
