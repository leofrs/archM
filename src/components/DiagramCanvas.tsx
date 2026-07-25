import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import svgPanZoom from "svg-pan-zoom";
import { NodeModal, type InspectorNode } from "./NodeModal";
import { ReactFlowView } from "./ReactFlowView";
import { AgentPromptViewer } from "./AgentPromptViewer";
import { ExcalidrawView, type ExcalidrawViewRef } from "./ExcalidrawView";
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
}: DiagramCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const panZoomInstance = useRef<any>(null);
  const excalidrawRef = useRef<ExcalidrawViewRef>(null);

  const [viewMode, setViewMode] = useState<"mermaid" | "reactflow" | "excalidraw">("mermaid");
  const [mermaidSubMode, setMermaidSubMode] = useState<"flowchart" | "sequence">("flowchart");
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [editableCode, setEditableCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<InspectorNode | null>(null);
  const [fallbackInfo, setFallbackInfo] = useState<FallbackInfo | null>(null);

  const isLowLevel = mode === "low-level";
  const activeMermaidCode =
    mermaidSubMode === "sequence"
      ? (mermaidSequenceCode || "")
      : mermaidCode;

  useEffect(() => {
    if (!document.getElementById("font-awesome-cdn")) {
      const link = document.createElement("link");
      link.id = "font-awesome-cdn";
      link.rel = "stylesheet";
      link.href =
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css";
      document.head.appendChild(link);
    }
  }, []);

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

    const nodeElements = svgElement.querySelectorAll("g.node, .node, g.actor, .actor");
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
      const { svg, fallbackInfo: fbInfo, finalCode } =
        await renderMermaidWithFallback(id, codeToRender);

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
    if (activeMermaidCode && viewMode === "mermaid") {
      renderDiagram(activeMermaidCode);
      setSelectedNode(null);
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
      {/* CABEÇALHO SUPERIOR FIXO UNIFICADO */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 shrink-0 flex items-center justify-between z-30 shadow-xs">
        {/* Esquerda: Menu Lateral + Seletor de Modo */}
        <div className="flex items-center gap-2">
          {!isSidebarOpen && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all h-9"
              title="Abrir Menu Lateral"
            >
              <i className="fa-solid fa-bars text-sm"></i>
              <span>Menu</span>
            </button>
          )}

          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1 h-9 items-center">
            <button
              type="button"
              onClick={() => setViewMode("mermaid")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 h-7 ${
                viewMode === "mermaid"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <i className="fa-solid fa-diagram-project"></i>
              <span>Diagrama Mermaid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("reactflow")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 h-7 ${
                viewMode === "reactflow"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <i className="fa-solid fa-vector-square"></i>
              <span>Editor Interativo (React Flow)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("excalidraw")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 h-7 ${
                viewMode === "excalidraw"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <i className="fa-solid fa-pen-ruler"></i>
              <span>Desenho Livre (Excalidraw)</span>
            </button>
          </div>

          {/* Sub-seletor do tipo de Diagrama Mermaid (Fluxograma TD vs Sequência) */}
          {viewMode === "mermaid" && (isLowLevel || !!mermaidSequenceCode) && (
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex gap-1 h-9 items-center ml-1">
              <button
                type="button"
                onClick={() => setMermaidSubMode("flowchart")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 h-7 ${
                  mermaidSubMode === "flowchart"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Ver Fluxograma (graph TD)"
              >
                <i className="fa-solid fa-sitemap"></i>
                <span>Fluxograma (TD)</span>
              </button>
              <button
                type="button"
                onClick={() => setMermaidSubMode("sequence")}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 h-7 ${
                  mermaidSubMode === "sequence"
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="Ver Diagrama de Sequência (sequenceDiagram)"
              >
                <i className="fa-solid fa-list-ol"></i>
                <span>Diagrama de Sequência</span>
              </button>
            </div>
          )}
        </div>

        {/* Direita: Ações Contextuais */}
        <div className="flex items-center gap-2">
          {viewMode === "excalidraw" && (
            <button
              type="button"
              onClick={() => excalidrawRef.current?.analyzeDrawing()}
              disabled={isLoading}
              className="h-9 px-3.5 border border-indigo-600 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-xs"
              title="Enviar o desenho livre para ser analisado pela IA Gemini"
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
          )}

          {viewMode === "mermaid" && (
            <>
              <button
                className="w-9 h-9 border border-slate-200 bg-slate-100 rounded-lg cursor-pointer text-lg font-bold text-slate-800 flex items-center justify-center transition-colors hover:bg-slate-200 hover:text-indigo-600"
                onClick={handleZoomIn}
                title="Aumentar Zoom"
              >
                +
              </button>
              <button
                className="w-9 h-9 border border-slate-200 bg-slate-100 rounded-lg cursor-pointer text-lg font-bold text-slate-800 flex items-center justify-center transition-colors hover:bg-slate-200 hover:text-indigo-600"
                onClick={handleZoomOut}
                title="Diminuir Zoom"
              >
                -
              </button>
              <button
                className="h-9 px-3 border border-slate-200 bg-slate-100 rounded-lg cursor-pointer text-xs font-semibold text-slate-800 flex items-center justify-center transition-colors hover:bg-slate-200 hover:text-indigo-600"
                onClick={handleResetZoom}
              >
                Resetar Visão
              </button>
            </>
          )}

          <button
            className={`h-9 px-3 border rounded-lg cursor-pointer text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
              showCodeEditor
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200 hover:text-indigo-600"
            }`}
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            title="Abrir/Fechar Editor de Código Mermaid"
          >
            <i className="fa-solid fa-code"></i>
            <span>{showCodeEditor ? "Ocultar Editor" : "Ver Código"}</span>
          </button>

          <button
            className="h-9 px-3 border border-slate-200 bg-slate-100 rounded-lg cursor-pointer text-xs font-semibold text-slate-800 flex items-center justify-center transition-colors hover:bg-slate-200 hover:text-indigo-600 gap-1.5"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
          >
            <i
              className={`fa-solid ${isFullscreen ? "fa-compress" : "fa-expand"}`}
            ></i>
            <span>{isFullscreen ? "Sair Fullscreen" : "Tela Cheia"}</span>
          </button>

          {viewMode === "mermaid" && (
            <button
              className="h-9 px-3 border border-indigo-100 bg-indigo-50 rounded-lg cursor-pointer text-xs font-semibold text-indigo-600 flex items-center justify-center transition-colors hover:bg-indigo-100"
              onClick={handleDownload}
            >
              Baixar SVG
            </button>
          )}
        </div>
      </header>

      {/* BANNER INFORMATIVO DE FALLBACK AUTOMÁTICO DO GRÁFICO */}
      {fallbackInfo && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between z-30 text-xs text-amber-900 shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
              <i className="fa-solid fa-triangle-exclamation text-sm"></i>
            </div>
            <div>
              <div className="font-bold text-amber-950 flex items-center gap-1.5">
                <span>Fallback Automático de Gráfico Aplicado</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900 text-[10px] font-mono">
                  {fallbackInfo.strategyUsed}
                </span>
              </div>
              <p className="text-amber-800 text-[11px]">
                {fallbackInfo.description} (Erro original: <code className="bg-amber-100 px-1 rounded font-mono">{fallbackInfo.originalError.slice(0, 65)}...</code>)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowCodeEditor(true)}
              className="px-2.5 py-1 bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-lg font-semibold transition-colors text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <i className="fa-solid fa-code"></i>
              <span>Ver Código Ajustado</span>
            </button>
            {onRegenerateGraphOnly && (
              <button
                type="button"
                onClick={() =>
                  onRegenerateGraphOnly(activeMermaidCode, fallbackInfo.originalError)
                }
                disabled={isLoading}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
              >
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                <span>Regerar Gráfico com IA</span>
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

      {/* ÁREA DO CANVAS (CONTAINER FLEX-1) */}
      <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
        {/* PROMPT DO AGENTE (HARNESS) - PAINEL SOBREPOSTO EXPANSÍVEL */}
        {agentPrompt && (
          <div className="absolute top-4 right-4 z-20 pointer-events-none flex justify-center">
            <div className="w-full max-w-5xl pointer-events-auto px-2">
              <AgentPromptViewer prompt={agentPrompt} />
            </div>
          </div>
        )}

        {/* CONTEÚDO 1: VISÃO MERMAID SVG */}
        {viewMode === "mermaid" && (
          <div
            id="mermaid-container"
            ref={containerRef}
            className="w-full h-full overflow-hidden flex justify-center items-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(100, 116, 139, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 116, 139, 0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          >
            {!activeMermaidCode && (
              <div className="text-slate-500 text-sm text-center">
                <div className="text-3xl mb-2.5">⌘</div>O diagrama gerado
                aparecerá aqui.
              </div>
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

      {/* Editor de Código Mermaid */}
      {showCodeEditor && (
        <div className="absolute bottom-0 left-0 right-0 h-[280px] bg-slate-900 border-t border-slate-800 flex flex-col z-30 shadow-2xl transition-all">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
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
