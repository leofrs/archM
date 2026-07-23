import React, { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import svgPanZoom from "svg-pan-zoom";

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  securityLevel: "loose",
});

export function DiagramCanvas({
  mermaidCode,
  onError,
  onRenderSuccess,
  isSidebarOpen,
  setIsSidebarOpen,
}) {
  const containerRef = useRef(null);
  const mainRef = useRef(null);
  const panZoomInstance = useRef(null);

  // Estados para o Live Code Editor
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [editableCode, setEditableCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Injeta FontAwesome CDN
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

  // Sincroniza o código vindo da IA com o editor local
  useEffect(() => {
    setEditableCode(mermaidCode);
  }, [mermaidCode]);

  // Monitora alterações do estado de Tela Cheia
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Alterna Modo Tela Cheia
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

  // Funções de Renderização do Mermaid
  const renderDiagram = async (codeToRender) => {
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
        }
      }

      onRenderSuccess();
    } catch (e) {
      onError(
        `Erro de sintaxe no Mermaid: ${e.message}\n\nCódigo Atual:\n${codeToRender}`,
      );
    }
  };

  // Re-renderiza quando o mermaidCode original da IA altera
  useEffect(() => {
    if (mermaidCode) {
      renderDiagram(mermaidCode);
    }
  }, [mermaidCode]);

  // Aplica edições manuais feitas pelo usuário no Live Editor
  const handleApplyManualEdit = () => {
    renderDiagram(editableCode);
  };

  // Copia o código Mermaid para a área de transferência
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
      style={{
        backgroundImage:
          "linear-gradient(rgba(100, 116, 139, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(100, 116, 139, 0.1) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Botão de Expandir o Menu (Visível quando recolhido) */}
      {!isSidebarOpen && (
        <button
          type="button"
          onClick={() => setIsSidebarOpen(true)}
          className="absolute top-5 left-5 z-20 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-slate-50 px-3 py-2 rounded-xl shadow-sm flex items-center gap-2 text-xs font-semibold cursor-pointer transition-all"
          title="Abrir Menu Lateral"
        >
          <i className="fa-solid fa-bars text-sm"></i>
          <span>Menu</span>
        </button>
      )}

      {/* Toolbar Superior */}
      <div className="absolute top-5 right-5 z-20 flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
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

        {/* Botão do Live Code Editor */}
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

        {/* Botão Tela Cheia */}
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

      {/* Mermaid SVG Canvas */}
      <div
        id="mermaid-container"
        ref={containerRef}
        className="w-full h-full overflow-hidden flex justify-center items-center [&_svg]:w-full [&_svg]:h-full [&_svg]:max-w-none"
      >
        {!mermaidCode && (
          <div className="text-slate-500 text-sm text-center">
            <div className="text-3xl mb-2.5">⌘</div>O diagrama gerado aparecerá
            aqui.
          </div>
        )}
      </div>

      {/* Painel do Live Code Editor (Gaveta Inferior) */}
      {showCodeEditor && (
        <div className="absolute bottom-0 left-0 right-0 h-[280px] bg-slate-900 border-t border-slate-800 flex flex-col z-30 shadow-2xl transition-all">
          {/* Header do Editor */}
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <i className="fa-solid fa-code text-indigo-400"></i>
              <span>Editor de Código Mermaid (Edição em Tempo Real)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <i
                  className={`fa-solid ${copied ? "fa-check text-emerald-400" : "fa-copy"}`}
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

          {/* Textarea do Código */}
          <textarea
            className="flex-1 w-full p-4 bg-slate-900 text-slate-200 font-mono text-xs outline-none resize-none leading-relaxed"
            value={editableCode}
            onChange={(e) => setEditableCode(e.target.value)}
            placeholder="O código Mermaid gerado pela IA aparecerá aqui. Você pode editá-lo diretamente..."
            spellCheck={false}
          ></textarea>
        </div>
      )}
    </main>
  );
}
