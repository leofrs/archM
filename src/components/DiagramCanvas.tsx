import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import svgPanZoom from "svg-pan-zoom";
import { NodeInspectorDrawer, type InspectorNode } from "./NodeInspectorDrawer";
import { ReactFlowView } from "./ReactFlowView";
import { AgentPromptViewer } from "./AgentPromptViewer";

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  securityLevel: "loose",
});

interface DiagramCanvasProps {
  mermaidCode: string;
  nodesMetadata?: Record<string, any>;
  agentPrompt?: string;
  onError: (msg: string) => void;
  onRenderSuccess: () => void;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  onMermaidCodeChange?: (newCode: string) => void;
}

export function DiagramCanvas({
  mermaidCode,
  nodesMetadata,
  agentPrompt,
  onError,
  onRenderSuccess,
  isSidebarOpen,
  setIsSidebarOpen,
  onMermaidCodeChange,
}: DiagramCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const panZoomInstance = useRef<any>(null);

  const [viewMode, setViewMode] = useState<"mermaid" | "reactflow">("mermaid");
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [editableCode, setEditableCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<InspectorNode | null>(null);

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
    setEditableCode(mermaidCode);
  }, [mermaidCode]);

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

    const nodeElements = svgElement.querySelectorAll("g.node, .node");
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
      const { svg } = await mermaid.render(id, codeToRender);

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
      onError(
        `Erro de sintaxe no Mermaid: ${e.message}\n\nCódigo Atual:\n${codeToRender}`,
      );
    }
  };

  useEffect(() => {
    if (mermaidCode && viewMode === "mermaid") {
      renderDiagram(mermaidCode);
      setSelectedNode(null);
    }
  }, [mermaidCode, viewMode]);

  const handleSaveFromReactFlow = (newMermaidCode: string) => {
    setEditableCode(newMermaidCode);
    if (onMermaidCodeChange) {
      onMermaidCodeChange(newMermaidCode);
    }
    renderDiagram(newMermaidCode);
  };

  const handleApplyManualEdit = () => {
    if (onMermaidCodeChange) {
      onMermaidCodeChange(editableCode);
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
      className="flex-1 relative flex flex-col bg-slate-50 overflow-hidden"
    >
      {/* BARRA SUPERIOR ESQUERDA (UNIFICADA - NÍVEL 1) */}
      <div className="absolute top-5 left-5 z-30 flex items-center gap-2">
        {/* Botão de Expandir Menu Lateral */}
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 px-3 py-2 rounded-xl shadow-sm flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all h-9"
            title="Abrir Menu Lateral"
          >
            <i className="fa-solid fa-bars text-sm"></i>
            <span>Menu</span>
          </button>
        )}

        {/* Alternador de Modo de Visão */}
        <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex gap-1 h-9 items-center">
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
        </div>
      </div>

      {/* BARRA SUPERIOR DIREITA */}
      <div className="absolute top-5 right-5 z-30 flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
        {viewMode === "mermaid" && (
          <>
            <button
              className="w-9 h-9 border border-transparent bg-slate-100 rounded-md cursor-pointer text-lg font-bold text-slate-800 flex items-center justify-center transition-colors hover:bg-slate-200 hover:text-indigo-600"
              onClick={handleZoomIn}
              title="Aumentar Zoom"
            >
              +
            </button>
            <button
              className="w-9 h-9 border border-transparent bg-slate-100 rounded-md cursor-pointer text-lg font-bold text-slate-800 flex items-center justify-center transition-colors hover:bg-slate-200 hover:text-indigo-600"
              onClick={handleZoomOut}
              title="Diminuir Zoom"
            >
              -
            </button>
            <button
              className="h-9 px-3 border border-transparent bg-slate-100 rounded-md cursor-pointer text-xs font-semibold text-slate-800 flex items-center justify-center transition-colors hover:bg-slate-200 hover:text-indigo-600"
              onClick={handleResetZoom}
            >
              Resetar Visão
            </button>
          </>
        )}

        <button
          className={`h-9 px-3 border rounded-md cursor-pointer text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            showCodeEditor
              ? "bg-indigo-600 text-white border-indigo-600"
              : "border-transparent bg-slate-100 text-slate-800 hover:bg-slate-200 hover:text-indigo-600"
          }`}
          onClick={() => setShowCodeEditor(!showCodeEditor)}
          title="Abrir/Fechar Editor de Código Mermaid"
        >
          <i className="fa-solid fa-code"></i>
          <span>{showCodeEditor ? "Ocultar Editor" : "Ver Código"}</span>
        </button>

        <button
          className="h-9 px-3 border border-transparent bg-slate-100 rounded-md cursor-pointer text-xs font-semibold text-slate-800 flex items-center justify-center transition-colors hover:bg-slate-200 hover:text-indigo-600 gap-1.5"
          onClick={toggleFullscreen}
          title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
        >
          <i
            className={`fa-solid ${isFullscreen ? "fa-compress" : "fa-expand"}`}
          ></i>
          <span>{isFullscreen ? "Sair Fullscreen" : "Tela Cheia"}</span>
        </button>

        <button
          className="h-9 px-3 border border-indigo-100 bg-slate-100 rounded-md cursor-pointer text-xs font-semibold text-indigo-600 flex items-center justify-center transition-colors hover:bg-slate-200"
          onClick={handleDownload}
        >
          Baixar SVG
        </button>
      </div>

      {/* PROMPT DO AGENTE (HARNESS) - PAINEL SOBREPOSTO EXPANSÍVEL */}
      {agentPrompt && (
        <div className="absolute top-18 right-2 z-20 pointer-events-none flex justify-center">
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
          {!mermaidCode && (
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
          onSaveMermaid={handleSaveFromReactFlow}
        />
      )}

      {/* Gaveta de Inspeção do Nó */}
      {viewMode === "mermaid" && (
        <NodeInspectorDrawer
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}

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
